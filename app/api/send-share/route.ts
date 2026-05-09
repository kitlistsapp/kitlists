import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { shareId, recipientEmail, listName, dopName, companyName, token } = await request.json()

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: 'KitList <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `${dopName} has shared a gear list with you — ${listName}`,
      html: `
        <div style='font-family: helvetica, arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px 32px;'>
          <h1 style='font-size: 24px; font-weight: bold; margin: 0 0 4px;'>Kit<span style='color: #fb923c;'>List</span></h1>
          <p style='color: #71717a; font-size: 12px; margin: 0 0 32px; letter-spacing: 0.1em; text-transform: uppercase;'>Camera Equipment Platform</p>

          <hr style='border: none; border-top: 1px solid #27272a; margin: 0 0 32px;' />

          <p style='color: #a1a1aa; font-size: 14px; margin: 0 0 8px;'>${dopName}${companyName ? ' · ' + companyName : ''} has shared a gear list with you.</p>
          <h2 style='font-size: 20px; font-weight: bold; margin: 0 0 24px;'>${listName}</h2>

          <a href='${shareUrl}' style='display: inline-block; background: #fb923c; color: #000; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;'>View gear list</a>

          <p style='color: #52525b; font-size: 12px; margin: 32px 0 0;'>Or copy this link: <a href='${shareUrl}' style='color: #fb923c;'>${shareUrl}</a></p>

          <hr style='border: none; border-top: 1px solid #27272a; margin: 32px 0;' />
          <p style='color: #3f3f46; font-size: 11px; margin: 0;'>Powered by KitList</p>
        </div>
      `
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}