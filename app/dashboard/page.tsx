import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: lists } = await supabase
    .from("gear_lists")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Kit<span className="text-orange-400">List</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">{user.email}</span>
          <a href="/auth/signout" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign out</a>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">My Gear Lists</h2>
            <p className="text-zinc-500 text-sm mt-1">Create and manage your camera equipment lists</p>
          </div>
          <a href="/lists/new" className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">+ New List</a>
        </div>
        {!lists || lists.length === 0 ? (
          <div className="border border-dashed border-zinc-700 rounded-2xl p-16 text-center">
            <p className="text-zinc-400 text-lg mb-2">No gear lists yet</p>
            <p className="text-zinc-600 text-sm mb-6">Create your first list to get started</p>
            <a href="/lists/new" className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-3 rounded-lg text-sm transition-colors inline-block">Create your first list</a>
          </div>
        ) : (
          <div className="grid gap-4">
            {lists.map((list: any) => (
              <a key={list.id} href={`/lists/${list.id}`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-6 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{list.project_name}</h3>
                    <p className="text-zinc-500 text-sm mt-1">{list.production_co}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${list.status === "confirmed" ? "bg-green-900 text-green-400" : list.status === "sent" ? "bg-blue-900 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>{list.status}</span>
                    <p className="text-zinc-600 text-xs mt-2">{list.shoot_start ? new Date(list.shoot_start).toLocaleDateString("en-AU") : "No date set"}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
