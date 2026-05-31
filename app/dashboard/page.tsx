import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from('profiles').select('full_name, company_name, company_logo_url').eq('id', user.id).single()

  let logoUrl = null
  if (profile?.company_logo_url) {
    const { data: signed } = await supabase.storage.from('logos').createSignedUrl(profile.company_logo_url, 3600)
    if (signed) logoUrl = signed.signedUrl
  }

  // Auto-archive lists past their post_return_date
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('gear_lists')
    .update({ status: 'archived' })
    .eq('owner_id', user.id)
    .in('status', ['draft', 'sent'])
    .lt('post_return_date', today)
    .not('post_return_date', 'is', null)

  const { data: lists } = await supabase
    .from("gear_lists")
    .select("*, rental_houses(name), camera_pages(id), shoot_specs(format, resolution)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const { data: shares } = await supabase.from('list_shares').select('list_id')
  const shareCounts: Record<string, number> = {}
  if (shares) shares.forEach((s: any) => { shareCounts[s.list_id] = (shareCounts[s.list_id] || 0) + 1 })

  // Invites sent by this user (1st AC invites)
  const { data: invites } = await supabase
    .from('list_collaborators')
    .select('list_id, invited_email, accepted_at')
    .eq('invited_by', user.id)

  const inviteMap: Record<string, { email: string, accepted: boolean }[]> = {}
  if (invites) {
    invites.forEach((inv: any) => {
      if (!inviteMap[inv.list_id]) inviteMap[inv.list_id] = []
      inviteMap[inv.list_id].push({ email: inv.invited_email, accepted: !!inv.accepted_at })
    })
  }

  // Lists shared with this user as collaborator
  const { data: collaboratedLists } = await supabase
    .from('list_collaborators')
    .select('*, gear_lists(*, rental_houses(name), camera_pages(id), shoot_specs(format, resolution), profiles(full_name, company_name))')
    .eq('collaborator_id', user.id)
    .not('accepted_at', 'is', null)

  const collabListsData = (collaboratedLists || []).map((c: any) => ({ ...c.gear_lists, _collab: true, _invitedBy: c.gear_lists?.profiles }))

  return (
    <DashboardClient
      user={{ ...user, full_name: profile?.full_name, company_name: profile?.company_name, logo_url: logoUrl }}
      initialLists={lists || []}
      initialShares={shareCounts}
      collaboratedLists={collabListsData}
      inviteMap={inviteMap}
    />
  )
}
