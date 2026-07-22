// Outreach email templates — used by /api/hq/outreach (Charlie's admin panel).
// Same raw-HTML Resend pattern as the welcome email.

const APP_URL = 'https://kitlists.app'

const wrapper = (inner: string) => `
  <div style="font-family: helvetica, arial, sans-serif; max-width: 560px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 12px;">
    <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 4px;">Kit<span style="color: #FFE135;">Lists</span></h1>
    <p style="color: #71717a; font-size: 11px; margin: 0; letter-spacing: 0.1em; text-transform: uppercase;">Camera Equipment Platform</p>
    <div style="height: 3px; background: #FFE135; margin: 20px 0 24px;"></div>
    ${inner}
    <hr style="border: none; border-top: 1px solid #27272a; margin: 28px 0 16px;" />
    <table style="width: 100%;">
      <tr>
        <td style="color: #3f3f46; font-size: 12px; font-weight: 700;">Kit<span style="color: #FFE135;">Lists</span></td>
        <td style="text-align: right;">
          <a href="https://www.instagram.com/kitlists.app" style="color: #52525b; font-size: 12px; text-decoration: none; margin-right: 16px;">@kitlists.app</a>
          <a href="${APP_URL}" style="color: #52525b; font-size: 12px; text-decoration: none;">kitlists.app</a>
        </td>
      </tr>
    </table>
  </div>
`

const featureRow = (num: string, title: string, text: string) => `
  <tr>
    <td style="padding: 10px 14px; background: #18181b; border-left: 3px solid #FFE135; border-radius: 6px;">
      <span style="background: #FFE135; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50%; margin-right: 10px;">${num}</span>
      <strong style="color: #fff; font-size: 14px;">${title}</strong>
      <span style="color: #71717a; font-size: 14px;"> — ${text}</span>
    </td>
  </tr>
  <tr><td style="height: 8px;"></td></tr>
`

// ── Template 1: Invite — for DOPs/ACs who have NOT signed up ──
export function inviteSubject() {
  return 'Your gear list, sorted — from a working 1st AC'
}

export function inviteHtml(firstName?: string | null) {
  const hello = firstName ? `Hi ${firstName},` : 'Hi,'
  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Still building gear lists in a spreadsheet?</h2>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">${hello}</p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">
      I'm Charlie — a 1st AC working in Sydney, 23 years in the camera department. I got tired of every prep starting with a messy spreadsheet, a long email chain and three versions of the same list. So we built <strong style="color: #fff;">KitLists</strong>.
    </p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 20px;">
      One live gear list — built by the DOP and 1st AC together, then shared with the rental house and production, each seeing exactly what they need:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
      ${featureRow('1', 'Build your package in minutes', 'camera bodies, power, filtration, AKS, head &amp; legs — every section of a real prep.')}
      ${featureRow('2', '4,000+ lens database', 'ARRI, ZEISS, Cooke, Canon, Panavision and 100+ more. Tap to add — exact names, no typing.')}
      ${featureRow('3', 'Prep with your 1st AC', "invite them onto the list — they add their kit and mark what's AC-owned, live.")}
      ${featureRow('4', 'Share with control', 'rental house sees full detail with DOP/AC ownership. Production sees a clean "Supplied" view.')}
      ${featureRow('5', 'PDF, Excel &amp; LUTs', 'email straight from KitLists or download — LUTs attach automatically for whoever needs them.')}
    </table>

    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 24px;">
      It's <strong style="color: #FFE135;">free during beta</strong>, it works beautifully on your phone, and it's already being used by DOPs and ACs on real jobs.
    </p>

    <a href="${APP_URL}/login?signup=true" style="display: inline-block; background: #FFE135; color: #000; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; text-decoration: none;">
      Make your first list — free →
    </a>

    <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
      Built by crew, for crew — on set, not in a boardroom. See it in action at <a href="${APP_URL}" style="color: #FFE135; text-decoration: none;">kitlists.app</a>.
    </p>
    <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 16px 0 0;">
      Charlie &amp; Lee Whitaker<br />
      <span style="color: #71717a;">Founders, KitLists — Sydney</span>
    </p>
  `)
}

// ── Template 2: Follow-up — for people we invited who haven't signed up ──
export function followupSubject() {
  return 'Quick nudge — your gear list is still waiting'
}

export function followupHtml(firstName?: string | null) {
  const hello = firstName ? `Hi ${firstName},` : 'Hi,'
  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Still prepping the old way?</h2>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">${hello}</p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">
      Charlie again — I sent you a note about <strong style="color: #fff;">KitLists</strong> a little while back. No stress if it got buried in a prep week; this is just a quick nudge because it's the kind of thing you only need to try once.
    </p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 20px;">
      The short version, one more time:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
      ${featureRow('1', 'First list in about 15 minutes', 'tap through 4,000+ lenses and every prep section — no typing, no spreadsheet.')}
      ${featureRow('2', 'Your 1st AC preps with you', 'live on the same list, their kit badged AC-owned.')}
      ${featureRow('3', 'One share, right views', 'rental house gets full detail, production gets a clean list, PDF/Excel included.')}
    </table>

    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 24px;">
      It's <strong style="color: #FFE135;">free during beta</strong> and built here in Sydney by working crew. Next job that lands, give it one prep — if it doesn't save you time, delete the account and I'll never nudge you again.
    </p>

    <a href="${APP_URL}/login?signup=true" style="display: inline-block; background: #FFE135; color: #000; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; text-decoration: none;">
      Give it one prep →
    </a>

    <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
      Charlie Whitaker<br />
      <span style="color: #71717a;">1st AC · Co-founder, KitLists — Sydney</span>
    </p>
  `)
}

// ── Template 3: Re-engagement — for signed-up users who haven't built a list ──
export function reengageSubject() {
  return 'Your next prep just got easier — KitLists'
}

export function reengageHtml(firstName?: string | null) {
  const hello = firstName ? `Hi ${firstName},` : 'Hi,'
  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Your account's ready. Your kit is waiting.</h2>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">${hello}</p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 12px;">
      You signed up to KitLists — great call. But we noticed you haven't sent a list out yet, and honestly, that first one is where it clicks.
    </p>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 20px;">
      Here's what a first list looks like — most people do it in under 15 minutes:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
      ${featureRow('1', 'Set up your profile', 'your name, company and logo appear on every list you share — it looks properly professional.')}
      ${featureRow('2', 'Pick your bodies &amp; glass', 'tap through 4,000+ lenses instead of typing them. Power, filtration and AKS the same way.')}
      ${featureRow('3', 'Invite your 1st AC', "they prep with you live — adding their kit, marking what's AC-owned.")}
      ${featureRow('4', 'Hit share', 'rental house gets full detail, production gets a clean view, and you get PDF/Excel downloads.')}
    </table>

    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.65; margin: 0 0 24px;">
      Next job that comes in — build the list in KitLists and save it as a template. Every prep after that is half the work.
    </p>

    <a href="${APP_URL}/dashboard" style="display: inline-block; background: #FFE135; color: #000; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; text-decoration: none;">
      Build your first list →
    </a>

    <div style="background: #1a1500; border: 1px solid #3d3000; border-radius: 8px; padding: 16px 18px; margin: 28px 0 0;">
      <p style="color: #a07a00; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #FFE135;">We're in beta and we listen.</strong> If something's missing — a lens, a feature, anything — hit the Feedback tab on your dashboard and it goes straight to us. Real crew feedback is shaping this tool every week.
      </p>
    </div>

    <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
      Charlie &amp; Lee Whitaker<br />
      <span style="color: #71717a;">Founders, KitLists — Sydney</span>
    </p>
  `)
}

export const TEMPLATES = {
  invite: { subject: inviteSubject, html: inviteHtml, label: 'Invite — new people' },
  followup: { subject: followupSubject, html: followupHtml, label: 'Follow-up — invited, not signed up' },
  reengage: { subject: reengageSubject, html: reengageHtml, label: 'Re-engage — signed up, not active' },
} as const

export type TemplateKey = keyof typeof TEMPLATES
