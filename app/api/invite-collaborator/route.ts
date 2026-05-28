import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { listId, invitedEmail } = await request.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: list } = await supabase.from('gear_lists').select('project_name').eq('id', listId).single()
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('full_name, company_name').eq('id', user.id).single()

  const { data: invite, error } = await supabase
    .from('list_collaborators')
    .insert({ list_id: listId, invited_email: invitedEmail, invited_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`
  const dopName = profile?.full_name || 'Your DOP'
  const company = profile?.company_name ? ` (${profile.company_name})` : ''

  await resend.emails.send({
    from: 'KitLists <onboarding@resend.dev>',
    to: invitedEmail,
    subject: `${dopName} invited you to collaborate on ${list.project_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:12px;">
        <h1 style="font-size:24px;font-weight:bold;margin-bottom:4px;">Kit<span style="color:#FFE135;">Lists</span></h1>
        <p style="color:#71717a;font-size:13px;margin-top:0;">Camera equipment management</p>
        <hr style="border:none;border-top:1px solid #27272a;margin:24px 0;">
        <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">You have been invited to collaborate</h2>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6;">
          <strong style="color:#fff;">${dopName}${company}</strong> has invited you to collaborate on the kit list for <strong style="color:#fff;">${list.project_name}</strong>.
        </p>
        <p style="color:#a1a1aa;font-size:14px;">As a collaborator you will have full access to view and edit the list.</p>
        <a href="${inviteUrl}" style="display:inline-block;margin-top:24px;background:#FFE135;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
          Accept invitation
        </a>
        <p style="color:#52525b;font-size:12px;margin-top:32px;">Or copy this link: ${inviteUrl}</p>
        <hr style="border:none;border-top:1px solid #27272a;margin:24px 0;">
        <p style="color:#52525b;font-size:11px;">Powered by KitLists</p>
      </div>
    `
  })

  return NextResponse.json({ success: true, token: invite.token })
}
