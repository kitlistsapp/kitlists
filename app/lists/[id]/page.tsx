import { createClient } from "@/lib/supabase/server"
import SaveAsTemplate from "./SaveAsTemplate"
import { redirect } from "next/navigation"

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: list } = await supabase.from("gear_lists").select("*").eq("id", id).single()
  if (!list) redirect("/dashboard")

  const { data: cameras } = await supabase.from("camera_pages").select("*, equipment_items(name)").eq("list_id", id).order("sort_order")
  const { data: lenses } = await supabase.from("list_lenses").select("*, equipment_items(name), list_lens_zooms(*, equipment_items(name))").eq("list_id", id).maybeSingle()
  const { data: misc } = await supabase.from("list_misc_items").select("*, equipment_items(name)").eq("list_id", id)
  const { data: specs } = await supabase.from("shoot_specs").select("*").eq("list_id", id).maybeSingle()
  const { data: files } = await supabase.from("list_files").select("*").eq("list_id", id).order("created_at")

  const camItems = await Promise.all((cameras || []).map(async (cam: any) => {
    const { data: items } = await supabase.from("camera_page_items").select("*, equipment_items(name)").eq("page_id", cam.id)
    return { ...cam, items: items || [] }
  }))

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm">Dashboard</a>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{list.project_name}</h2>
              <p className="text-zinc-500 text-sm mt-1">{list.production_co}</p>
              <div className="flex gap-4 mt-2 text-xs text-zinc-600">
                {list.shoot_start && <span>Shoot: {new Date(list.shoot_start).toLocaleDateString("en-AU")}</span>}
                {list.shoot_days && <span>{list.shoot_days} days</span>}
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${ list.status === "confirmed" ? "bg-green-900 text-green-400" : list.status === "sent" ? "bg-blue-900 text-blue-400" : "bg-zinc-800 text-zinc-400" }`}>{list.status}</span>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            <a href={`/lists/${id}/share`} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Share</a>
            <a href={`/lists/${id}/edit`} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">Edit details</a>
            <SaveAsTemplate listId={id} />
          </div>
        </div>

        <div className="space-y-3">

          {camItems.map((cam: any) => {
            const bodyName = cam.equipment_items?.name
            const powerItems = cam.items.filter((i: any) => i.section === 'power')
            const aksItems = cam.items.filter((i: any) => i.section === 'aks')
            const gripItems = cam.items.filter((i: any) => i.section === 'grip')
            const filtItems = cam.items.filter((i: any) => i.section === 'filtration')
            const totalItems = cam.items.length
            const isConfigured = bodyName || totalItems > 0
            return (
              <div key={cam.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <a href={`/lists/${id}/camera/${cam.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ isConfigured ? 'bg-orange-400' : 'bg-zinc-700' }`} />
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">{cam.label}</h3>
                      {bodyName ? (
                        <p className="text-zinc-500 text-xs mt-0.5">{bodyName}{cam.camera_body_source === 'dop_owned' ? ' · DOP owned' : ''}</p>
                      ) : (
                        <p className="text-zinc-700 text-xs mt-0.5">No camera selected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isConfigured && (
                      <span className="text-xs text-zinc-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </a>
                {isConfigured && (
                  <div className="px-6 pb-4 border-t border-zinc-800 pt-3 grid grid-cols-2 gap-x-6 gap-y-1">
                    {powerItems.length > 0 && (
                      <div>
                        <span className="text-zinc-600 text-xs uppercase tracking-wider">Power</span>
                        {powerItems.map((i: any) => <p key={i.id} className="text-zinc-400 text-xs mt-0.5">{i.equipment_items?.name || i.custom_label}</p>)}
                      </div>
                    )}
                    {aksItems.length > 0 && (
                      <div>
                        <span className="text-zinc-600 text-xs uppercase tracking-wider">AKS</span>
                        {aksItems.map((i: any) => <p key={i.id} className="text-zinc-400 text-xs mt-0.5">{i.equipment_items?.name || i.custom_label}</p>)}
                      </div>
                    )}
                    {gripItems.length > 0 && (
                      <div className="mt-2">
                        <span className="text-zinc-600 text-xs uppercase tracking-wider">Grip</span>
                        {gripItems.map((i: any) => <p key={i.id} className="text-zinc-400 text-xs mt-0.5">{i.equipment_items?.name || i.custom_label}</p>)}
                      </div>
                    )}
                    {filtItems.length > 0 && (
                      <div className="mt-2">
                        <span className="text-zinc-600 text-xs uppercase tracking-wider">Filtration</span>
                        {filtItems.map((i: any) => <p key={i.id} className="text-zinc-400 text-xs mt-0.5">{i.equipment_items?.name || i.custom_label}</p>)}
                      </div>
                    )}
                    {cam.camera_notes && (
                      <div className="mt-2 col-span-2">
                        <span className="text-zinc-600 text-xs uppercase tracking-wider">Notes</span>
                        <p className="text-zinc-400 text-xs mt-0.5">{cam.camera_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/lenses`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ lenses ? 'bg-orange-400' : 'bg-zinc-700' }`} />
                <div>
                  <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">Lenses</h3>
                  {lenses ? (
                    <p className="text-zinc-500 text-xs mt-0.5">{lenses.equipment_items?.name || 'Prime set selected'}{lenses.list_lens_zooms?.length > 0 ? ` · ${lenses.list_lens_zooms.length} zoom${lenses.list_lens_zooms.length !== 1 ? 's' : ''}` : ''}</p>
                  ) : (
                    <p className="text-zinc-700 text-xs mt-0.5">Not configured</p>
                  )}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {lenses && (
              <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-1">
                {lenses.focal_lengths?.length > 0 && (
                  <p className="text-zinc-400 text-xs">Focal lengths: {lenses.focal_lengths.join(', ')}</p>
                )}
                {lenses.list_lens_zooms?.map((z: any) => (
                  <p key={z.id} className="text-zinc-400 text-xs">{z.equipment_items?.name}</p>
                ))}
                {lenses.zoom_controller && !lenses.zoom_controller.includes('-') && (
                  <p className="text-zinc-400 text-xs">Controller: {lenses.zoom_controller}</p>
                )}
                {lenses.source === 'dop_owned' && <p className="text-zinc-600 text-xs">DOP owned</p>}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/misc`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ misc && misc.length > 0 ? 'bg-orange-400' : 'bg-zinc-700' }`} />
                <div>
                  <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">Misc AKS</h3>
                  {misc && misc.length > 0 ? (
                    <p className="text-zinc-500 text-xs mt-0.5">{misc.length} item{misc.length !== 1 ? 's' : ''} selected</p>
                  ) : (
                    <p className="text-zinc-700 text-xs mt-0.5">Not configured</p>
                  )}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {misc && misc.length > 0 && (
              <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-0.5">
                {misc.map((i: any) => (
                  <p key={i.id} className="text-zinc-400 text-xs">{i.equipment_items?.name || i.custom_label}{i.notes ? ` · ${i.notes}` : ''}{i.source === 'dop_owned' ? ' · DOP owned' : ''}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/specs`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ specs ? 'bg-orange-400' : 'bg-zinc-700' }`} />
                <div>
                  <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">Shoot specs</h3>
                  {specs ? (
                    <p className="text-zinc-500 text-xs mt-0.5">{[specs.format, specs.resolution, specs.fps, specs.aspect_ratio].filter(Boolean).join(' · ')}</p>
                  ) : (
                    <p className="text-zinc-700 text-xs mt-0.5">Not configured</p>
                  )}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          <a href={`/lists/${id}/files`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-colors group mt-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ files && files.length > 0 ? 'bg-orange-400' : 'bg-zinc-700' }`} />
                <div>
                  <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">Files</h3>
                  <p className="text-zinc-600 text-xs mt-0.5">{files && files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : 'No files attached'}</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-orange-400 transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {files && files.length > 0 && (
              <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-0.5">
                {files.map((f: any) => (
                  <p key={f.id} className="text-zinc-400 text-xs">{f.name}</p>
                ))}
              </div>
            )}
          </a>

        </div>
      </main>
    </div>
  )
}