import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, notes } = await request.json()

    if (!type || !notes) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'KitLists Feedback <noreply@kitlists.app>',
      to: 'crewflowapps@gmail.com',
      subject: '[KitLists Feedback] ' + type,
      html:
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">' +
        '<h2 style="margin-top: 0; color: #111;">New KitLists Feedback</h2>' +
        '<table style="width: 100%; border-collapse: collapse;">' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; width: 120px;">Type</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee;">' + type + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; vertical-align: top;">User</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee;">' + (user.email ?? user.id) + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; vertical-align: top;">Notes</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee; white-space: pre-wrap;">' + notes + '</td></tr>' +
        '</table>' +
        '<p style="color: #888; font-size: 12px; margin-top: 24px;">Sent from kitlists.app</p>' +
        '</div>',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-feedback]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
