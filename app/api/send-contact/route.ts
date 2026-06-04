import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'KitLists Contact <noreply@kitlists.app>',
      to: ['crewflowapps@gmail.com'],
      replyTo: [email],
      subject: '[KitLists Contact] Message from ' + name,
      html:
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">' +
        '<h2 style="margin-top: 0; color: #111;">New Contact Message</h2>' +
        '<table style="width: 100%; border-collapse: collapse;">' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; width: 120px;">Name</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee;">' + name + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600;">Email</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee;"><a href="mailto:' + email + '">' + email + '</a></td></tr>' +
        '<tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; vertical-align: top;">Message</td>' +
        '<td style="padding: 8px 12px; border: 1px solid #eee; white-space: pre-wrap;">' + message + '</td></tr>' +
        '</table>' +
        '<p style="color: #888; font-size: 12px; margin-top: 24px;">Sent from kitlists.app — reply directly to respond to ' + name + '.</p>' +
        '</div>',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-contact]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
