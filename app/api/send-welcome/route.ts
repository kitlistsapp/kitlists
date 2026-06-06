import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, firstName } = await request.json()

  const greeting = firstName ? `Welcome, ${firstName} — you're in.` : `Welcome — you're in.`

  const html = `
    <div style="font-family: helvetica, arial, sans-serif; max-width: 560px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 12px;">
      <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 4px;">Kit<span style="color: #FFE135;">Lists</span></h1>
      <p style="color: #71717a; font-size: 11px; margin: 0 0 0; letter-spacing: 0.1em; text-transform: uppercase;">Camera Equipment Platform</p>
      <div style="height: 3px; background: #FFE135; margin: 20px 0 24px;"></div>
      <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">${greeting}</h2>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">
        KitLists is your centralised platform for building, collaborating on, and sharing camera department equipment packages — built by people who've actually done a prep.
      </p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 20px;">Here's how to get started:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="padding: 10px 14px; background: #18181b; border-left: 3px solid #FFE135; border-radius: 6px; margin-bottom: 8px; display: block; margin-bottom: 8px;">
            <span style="background: #FFE135; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50%; margin-right: 10px;">1</span>
            <strong style="color: #fff; font-size: 14px;">Complete your profile</strong>
            <span style="color: #71717a; font-size: 14px;"> — add your role, contact details, and the gear you own.</span>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
        <tr>
          <td style="padding: 10px 14px; background: #18181b; border-left: 3px solid #FFE135; border-radius: 6px;">
            <span style="background: #FFE135; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50%; margin-right: 10px;">2</span>
            <strong style="color: #fff; font-size: 14px;">Create a list</strong>
            <span style="color: #71717a; font-size: 14px;"> — cameras, lenses, power, grip, filtration, AKS.</span>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
        <tr>
          <td style="padding: 10px 14px; background: #18181b; border-left: 3px solid #FFE135; border-radius: 6px;">
            <span style="background: #FFE135; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50%; margin-right: 10px;">3</span>
            <strong style="color: #fff; font-size: 14px;">Invite your crew</strong>
            <span style="color: #71717a; font-size: 14px;"> — collaborate with your 1st AC or DOP before the list goes out.</span>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
        <tr>
          <td style="padding: 10px 14px; background: #18181b; border-left: 3px solid #FFE135; border-radius: 6px;">
            <span style="background: #FFE135; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50%; margin-right: 10px;">4</span>
            <strong style="color: #fff; font-size: 14px;">Share with control</strong>
            <span style="color: #71717a; font-size: 14px;"> — production, rental house, and crew each see exactly what they need. Nothing more.</span>
          </td>
        </tr>
      </table>

      <a href="https://kitlists.app" style="display: inline-block; background: #FFE135; color: #000; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; text-decoration: none;">
        Make your first list →
      </a>

      <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0 20px;" />

      <div style="background: #1a1500; border: 1px solid #3d3000; border-radius: 8px; padding: 16px 18px;">
        <p style="color: #a07a00; font-size: 13px; line-height: 1.6; margin: 0;">
          <strong style="color: #FFE135;">We're in beta — your feedback matters.</strong> If you hit a bug, find something missing, or have a feature idea, use the Feedback tab on your dashboard. The gear database is still growing — if something's not listed, let us know and we'll add it.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #27272a; margin: 28px 0 16px;" />

      <table style="width: 100%;">
        <tr>
          <td style="color: #3f3f46; font-size: 12px; font-weight: 700;">Kit<span style="color: #FFE135;">Lists</span></td>
          <td style="text-align: right;">
            <a href="https://www.instagram.com/kitlists.app" style="color: #52525b; font-size: 12px; text-decoration: none; margin-right: 16px;">@kitlists.app</a>
            <a href="https://kitlists.app" style="color: #52525b; font-size: 12px; text-decoration: none;">kitlists.app</a>
          </td>
        </tr>
      </table>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: 'KitLists <noreply@kitlists.app>',
      to: email,
      subject: 'Welcome to KitLists — time to build your first list',
      html,
    })
    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
