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

  const { data: lists } = await supabase
    .from("gear_lists")
    .select("*, rental_houses(name), camera_pages(id), shoot_specs(format, resolution)")
    .order("created_at", { ascending: false })

  const { data: shares } = await supabase.from('list_shares').select('list_id')
  const shareCounts: Record<string, number> = {}
  if (shares) shares.forEach((s: any) => { shareCounts[s.list_id] = (shareCounts[s.list_id] || 0) + 1 })

  return (
    <DashboardClient
      user={{ ...user, full_name: profile?.full_name, company_name: profile?.company_name, logo_url: logoUrl }}
      initialLists={lists || []}
      initialShares={shareCounts}
    />
  )
}
