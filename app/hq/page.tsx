import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin'
import HQClient from './HQClient'

export const dynamic = 'force-dynamic'

export default async function HQPage() {
  // Gate: logged-in + email on the ADMIN_EMAILS allowlist, otherwise 404
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) notFound()

  const admin = createAdminClient()

  // All auth users (email, created_at, last_sign_in_at)
  const allUsers: { id: string; email: string; created_at: string; last_sign_in_at: string | null }[] = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    allUsers.push(...data.users.map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    })))
    if (data.users.length < 1000) break
    page++
  }

  const [{ data: profiles }, { data: lists }, { data: shares }, { data: outreach }] = await Promise.all([
    admin.from('profiles').select('id, full_name, company_name, role, phone'),
    admin.from('gear_lists').select('id, owner_id, status, project_name, created_at'),
    admin.from('list_shares').select('*'),
    admin.from('outreach_invites').select('*').order('sent_at', { ascending: false }),
  ])

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const listsByOwner = new Map<string, any[]>()
  for (const l of lists || []) {
    if (!listsByOwner.has(l.owner_id)) listsByOwner.set(l.owner_id, [])
    listsByOwner.get(l.owner_id)!.push(l)
  }
  const shareCountByList = new Map<string, number>()
  const lastShareByList = new Map<string, string>()
  for (const s of shares || []) {
    shareCountByList.set(s.list_id, (shareCountByList.get(s.list_id) || 0) + 1)
    if (s.created_at) {
      const prev = lastShareByList.get(s.list_id)
      if (!prev || new Date(s.created_at) > new Date(prev)) lastShareByList.set(s.list_id, s.created_at)
    }
  }

  const now = Date.now()
  const days = (iso: string | null) => iso ? Math.floor((now - new Date(iso).getTime()) / 86400000) : null
  const latest = (a: string | null, b: string | null) => {
    if (!a) return b
    if (!b) return a
    return new Date(a) > new Date(b) ? a : b
  }

  const users = allUsers
    .map(u => {
      const p = profileMap.get(u.id)
      const userLists = listsByOwner.get(u.id) || []
      const sentLists = userLists.filter(l => l.status === 'sent')
      const sharesSent = userLists.reduce((acc, l) => acc + (shareCountByList.get(l.id) || 0), 0)

      // Real usage: when did they last CREATE a list, and last SHARE one?
      let lastListAt: string | null = null
      let lastShareAt: string | null = null
      for (const l of userLists) {
        lastListAt = latest(lastListAt, l.created_at || null)
        lastShareAt = latest(lastShareAt, lastShareByList.get(l.id) || null)
      }
      const activityAt = latest(lastListAt, lastShareAt)
      const activityType: 'shared' | 'created' | null =
        activityAt === null ? null : activityAt === lastShareAt && lastShareAt !== null ? 'shared' : 'created'
      const activityDays = days(activityAt)

      return {
        id: u.id,
        email: u.email,
        name: p?.full_name || null,
        company: p?.company_name || null,
        role: p?.role || null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        lists: userLists.length,
        sentLists: sentLists.length,
        sharesSent,
        lastListAt,
        lastShareAt,
        activityAt,
        activityType,
        // Dormant = never used it, or no list created / shared in 21+ days
        dormant: activityAt === null || (activityDays !== null && activityDays > 21),
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const userEmails = new Set(users.map(u => u.email.toLowerCase()))

  // Collapse outreach history to latest send per email+template, flag conversions
  const outreachRows = (outreach || []).map((o: any) => ({
    id: o.id,
    email: o.email,
    name: o.name,
    template: o.template,
    sentAt: o.sent_at,
    signedUp: userEmails.has((o.email || '').toLowerCase()),
  }))

  const withinDays = (iso: string, d: number) => (now - new Date(iso).getTime()) < d * 86400000

  const stats = {
    totalUsers: users.length,
    newThisWeek: users.filter(u => withinDays(u.createdAt, 7)).length,
    newThisMonth: users.filter(u => withinDays(u.createdAt, 30)).length,
    activeThisWeek: users.filter(u => u.activityAt && withinDays(u.activityAt, 7)).length,
    totalLists: (lists || []).length,
    sentLists: (lists || []).filter((l: any) => l.status === 'sent').length,
    listsThisWeek: (lists || []).filter((l: any) => l.created_at && withinDays(l.created_at, 7)).length,
    totalShares: (shares || []).length,
    dormantUsers: users.filter(u => u.dormant).length,
    invitesSent: outreachRows.filter(o => o.template === 'invite').length,
    invitesConverted: outreachRows.filter(o => o.template === 'invite' && o.signedUp).length,
  }

  return <HQClient stats={stats} users={users} outreach={outreachRows} adminEmail={user.email || ''} />
}
