import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin'
import { TEMPLATES, TemplateKey } from '@/lib/emails/outreach'

const resend = new Resend(process.env.RESEND_API_KEY)

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

// GET /api/hq/outreach?template=invite&name=Sample — returns preview HTML
export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const templateKey = searchParams.get('template') as TemplateKey
  const name = searchParams.get('name') || null
  const template = TEMPLATES[templateKey]
  if (!template) return NextResponse.json({ error: 'Unknown template' }, { status: 400 })

  return NextResponse.json({
    subject: template.subject(),
    html: template.html(name),
  })
}

// POST /api/hq/outreach
//   Real send:  { recipients: [{ email, name? }], template: 'invite' | 'reengage' }
//   Test send:  { test: true, testEmail, template } — subject gets a [TEST] prefix, nothing recorded
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { recipients, template: templateKey, test, testEmail, scheduledAt } = await request.json() as {
    recipients?: { email: string; name?: string }[]
    template: TemplateKey
    test?: boolean
    testEmail?: string
    scheduledAt?: string
  }

  const template = TEMPLATES[templateKey]
  if (!template) return NextResponse.json({ error: 'Unknown template' }, { status: 400 })

  // Optional scheduling (Resend supports up to 30 days ahead)
  let schedIso: string | undefined
  if (scheduledAt) {
    const d = new Date(scheduledAt)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid schedule time' }, { status: 400 })
    if (d.getTime() < Date.now() + 2 * 60_000) {
      return NextResponse.json({ error: 'Schedule time must be at least 2 minutes in the future' }, { status: 400 })
    }
    if (d.getTime() > Date.now() + 29 * 24 * 60 * 60_000) {
      return NextResponse.json({ error: 'Resend allows scheduling up to 30 days ahead' }, { status: 400 })
    }
    schedIso = d.toISOString()
  }

  // ── Test send: one email, [TEST] subject, not recorded in outreach_invites ──
  if (test) {
    const to = (testEmail || '').trim().toLowerCase()
    if (!to || !to.includes('@')) return NextResponse.json({ error: 'Invalid test email' }, { status: 400 })
    try {
      const { error } = await resend.emails.send({
        from: 'Charlie at KitLists <hello@kitlists.app>',
        to,
        subject: `[TEST] ${template.subject()}`,
        html: template.html('Lee'),
      })
      if (error) return NextResponse.json({ error: JSON.stringify(error) }, { status: 400 })
      return NextResponse.json({ sent: [to], failed: [], test: true })
    } catch {
      return NextResponse.json({ error: 'Test send failed' }, { status: 500 })
    }
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 })
  }
  if (recipients.length > 100) {
    return NextResponse.json({ error: 'Max 100 recipients per batch' }, { status: 400 })
  }

  const admin = createAdminClient()
  const sent: string[] = []
  const failed: { email: string; error: string }[] = []

  for (const r of recipients) {
    const email = (r.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      failed.push({ email: r.email || '(empty)', error: 'Invalid email' })
      continue
    }
    const firstName = (r.name || '').trim().split(' ')[0] || null

    try {
      const { data, error } = await resend.emails.send({
        from: 'Charlie at KitLists <hello@kitlists.app>',
        to: email,
        subject: template.subject(),
        html: template.html(firstName),
        scheduledAt: schedIso,
      })
      if (error) {
        failed.push({ email, error: typeof error === 'object' ? JSON.stringify(error) : String(error) })
      } else {
        sent.push(email)
        await admin.from('outreach_invites').insert({
          email,
          name: r.name?.trim() || null,
          template: templateKey,
          sent_by: user.email,
          scheduled_for: schedIso || null,
          resend_email_id: data?.id || null,
          status: schedIso ? 'scheduled' : 'sent',
        })
      }
    } catch {
      failed.push({ email, error: 'Send failed' })
    }

    // Resend rate limit is 2 req/sec — pace the batch
    await new Promise(res => setTimeout(res, 600))
  }

  return NextResponse.json({ sent, failed, scheduledFor: schedIso || null })
}

// PATCH /api/hq/outreach - { rowId } cancels a scheduled send (before it fires)
export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { rowId } = await request.json() as { rowId: string }
  if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 })

  const admin = createAdminClient()
  const { data: row } = await admin.from('outreach_invites').select('*').eq('id', rowId).single()
  if (!row) return NextResponse.json({ error: 'Row not found' }, { status: 404 })
  if (row.status !== 'scheduled' || !row.resend_email_id) {
    return NextResponse.json({ error: 'This send is not cancellable' }, { status: 400 })
  }

  try {
    const { error } = await resend.emails.cancel(row.resend_email_id)
    if (error) return NextResponse.json({ error: 'Resend refused the cancel - it may have already gone out' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
  }

  await admin.from('outreach_invites').update({ status: 'canceled' }).eq('id', rowId)
  return NextResponse.json({ success: true })
}
