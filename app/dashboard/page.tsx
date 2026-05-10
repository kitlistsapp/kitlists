import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const { data: lists } = await supabase
    .from("gear_lists")
    .select("*, rental_houses(name), camera_pages(id), shoot_specs(format, resolution)")
    .order("created_at", { ascending: false })

  const { data: shares } = await supabase.from('list_shares').select('list_id')
  const shareCounts: Record<string, number> = {}
  if (shares) shares.forEach((s: any) => { shareCounts[s.list_id] = (shareCounts[s.list_id] || 0) + 1 })

  return (
    <DashboardClient
      user={{ ...user, full_name: profile?.full_name }}
      initialLists={lists || []}
      initialShares={shareCounts}
    />
  )
}
