import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: list } = await supabase
    .from("gear_lists")
    .select("*")
    .eq("id", id)
    .single()

  if (!list) redirect("/dashboard")

  const { data: cameras } = await supabase
    .from("camera_pages")
    .select("*")
    .eq("list_id", id)
    .order("sort_order")

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">
          Kit<span className="text-orange-400">List</span>
        </a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Back to dashboard</a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{list.project_name}</h2>
              <p className="text-zinc-500 text-sm mt-1">{list.production_co}</p>
              <div className="flex gap-4 mt-2 text-xs text-zinc-600">
                {list.shoot_start && <span>Shoot: {new Date(list.shoot_start).toLocaleDateString("en-AU")}</span>}
                {list.shoot_days && <span>{list.shoot_days} days</span>}
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${list.status === "confirmed" ? "bg-green-900 text-green-400" : list.status === "sent" ? "bg-blue-900 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>{list.status}</span>
          </div>
        </div>

        <div className="grid gap-4">
          {cameras && cameras.map((cam: any) => (
            <a
              key={cam.id}
              href={`/lists/${id}/camera/${cam.id}`}
              className="block bg-zinc-900 border border-zinc-800 hover:border-orange-400 rounded-xl p-6 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg group-hover:text-orange-400 transition-colors">{cam.label}</h3>
                  <p className="text-zinc-600 text-sm mt-1">{cam.camera_body_id ? "Camera selected" : "No camera selected yet"}</p>
                </div>
                <div className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Lenses</h4>
            <a href={`/lists/${id}/lenses`} className="text-orange-400 hover:text-orange-300 text-sm transition-colors">Configure lens package</a>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Misc AKS</h4>
            <a href={`/lists/${id}/misc`} className="text-orange-400 hover:text-orange-300 text-sm transition-colors">Configure misc items</a>
          </div>
        </div>
      </main>
    </div>
  )
}