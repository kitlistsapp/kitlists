import { createClient } from "@/lib/supabase/server"
import SaveAsTemplate from "./SaveAsTemplate"
import InviteCollaborator from "./InviteCollaborator"
import { redirect } from "next/navigation"
import NavBar from "@/app/components/NavBar"

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: list } = await supabase.from("gear_lists").select("*").eq("id", id).single()
  if (!list) redirect("/dashboard")

  const [
    { data: cameras },
    { data: lensRows },
    { data: specs },
    { data: files },
    { data: listLuts },
    { data: listItems },
    { data: sectionNotesList }
  ] = await Promise.all([
    supabase.from("camera_pages").select("*, equipment_items(name)").eq("list_id", id).order("sort_order"),
    supabase.from("list_lenses").select("*").eq("list_id", id).order("sort_order"),
    supabase.from("shoot_specs").select("*").eq("list_id", id).maybeSingle(),
    supabase.from("list_files").select("*").eq("list_id", id).order("created_at"),
    supabase.from("list_lut_files").select("*").eq("list_id", id).order("created_at"),
    supabase.from("list_items").select("*, equipment_items(name, subcategory, category)").eq("list_id", id).order("sort_order"),
    supabase.from("list_section_notes").select("*").eq("list_id", id)
  ])

  const powerItems = (listItems || []).filter((i: any) => i.section === "power")
  const headTripodItems = (listItems || []).filter((i: any) => i.section === "head_tripod")
  const gripItems = (listItems || []).filter((i: any) => i.section === "grip")
  const filtrationItems = (listItems || []).filter((i: any) => i.section === "filtration")
  const aksItems = (listItems || []).filter((i: any) => i.section === "aks")
  const vtrItems = (listItems || []).filter((i: any) => i.section === "vtr")
  const getSectionNotes = (section: string) => (sectionNotesList || []).find((n: any) => n.section === section)?.notes || ''

  const arrow = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600 group-hover:text-[#FFE135] transition-colors flex-shrink-0">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const dot = (active: boolean) => (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ active ? "bg-[#FFE135]" : "bg-zinc-700" }`} />
  )

  const badge = (source: string) => {
    if (source === "dop_owned") return <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1 py-0.5 rounded-full">DOP</span>
    if (source === "ac_owned") return <span className="text-xs bg-blue-950 text-blue-400 px-1 py-0.5 rounded-full">AC</span>
    return null
  }

  const sectionCard = (title: string, href: string, items: any[], emptyText = "Not configured", notes = "") => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <a href={href} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
        <div className="flex items-center gap-3">
          {dot(items.length > 0)}
          <div>
            <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">{title}</h3>
            {items.length > 0 ? (
              <p className="text-zinc-500 text-xs mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            ) : (
              <p className="text-zinc-700 text-xs mt-0.5">{emptyText}</p>
            )}
          </div>
        </div>
        {arrow}
      </a>
      {items.length > 0 && (
        <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-0.5">
          {items.map((i: any) => (
            <div key={i.id} className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-xs">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ""}{i.notes ? ` · ${i.notes}` : ""}</span>
              {badge(i.source)}
            </div>
          ))}
        </div>
      )}
      {notes && (
        <details className="border-t border-zinc-800">
          <summary className="px-6 py-2.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 list-none flex items-center gap-1.5 select-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 details-arrow transition-transform"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Notes
          </summary>
          <p className="px-6 pb-4 text-zinc-400 text-xs leading-relaxed">{notes}</p>
        </details>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

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
            <a href={`/lists/${id}/share`} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Share</a>
            <a href={`/lists/${id}/edit`} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">Edit details</a>
            <InviteCollaborator listId={id} />
            <SaveAsTemplate listId={id} />
          </div>
        </div>

        <div className="space-y-3">

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/camera`} className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                {dot((cameras || []).some((c: any) => c.equipment_items?.name))}
                <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">Camera Body</h3>
              </div>
              {arrow}
            </a>
            {(cameras || []).map((cam: any, idx: number) => {
              const bodyName = cam.equipment_items?.name
              return (
                <a key={cam.id} href={`/lists/${id}/camera`}
                  className={`flex items-center px-6 py-3 ${idx < (cameras || []).length - 1 ? "border-b border-zinc-800" : ""}`}>
                  <div className="flex items-center gap-3">
                    {dot(!!bodyName)}
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-[#FFE135] transition-colors">{cam.label}</p>
                      {bodyName ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-500 text-xs">{bodyName}</span>
                          {badge(cam.camera_body_source)}
                        </div>
                      ) : (
                        <p className="text-zinc-700 text-xs">No camera selected</p>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>



          {sectionCard("Power", `/lists/${id}/power`, powerItems, "Not configured", getSectionNotes("power"))}

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/lenses`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                {dot((lensRows || []).length > 0)}
                <div>
                  <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">Lenses</h3>
                  {(lensRows || []).length > 0 ? (
                    <p className="text-zinc-500 text-xs mt-0.5">{(lensRows || []).length} lens{(lensRows || []).length !== 1 ? "es" : ""}</p>
                  ) : (
                    <p className="text-zinc-700 text-xs mt-0.5">Not configured</p>
                  )}
                </div>
              </div>
              {arrow}
            </a>
            {(lensRows || []).length > 0 && (
              <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-0.5">
                {(lensRows || []).map((l: any) => (
                  <div key={l.id} className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-xs">{l.manufacturer} {l.series} <span className="text-[#FFE135]">{l.focal_length}</span></span>
                    {badge(l.source)}
                  </div>
                ))}
              </div>
            )}
            {getSectionNotes("lenses") && (
              <details className="border-t border-zinc-800">
                <summary className="px-6 py-2.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 list-none flex items-center gap-1.5 select-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Notes
                </summary>
                <p className="px-6 pb-4 text-zinc-400 text-xs leading-relaxed">{getSectionNotes("lenses")}</p>
              </details>
            )}
          </div>
          {sectionCard("Filtration", `/lists/${id}/filtration`, filtrationItems, "Not configured", getSectionNotes("filtration"))}
          {sectionCard("AKS", `/lists/${id}/aks`, aksItems, "Not configured", getSectionNotes("aks"))}
          {sectionCard("Head & Legs", `/lists/${id}/head-tripod`, headTripodItems, "Not configured", getSectionNotes("head_tripod"))}
          {sectionCard("Gimbals", `/lists/${id}/grip`, gripItems, "Not configured", getSectionNotes("grip"))}
          {sectionCard("VTR", `/lists/${id}/vtr`, vtrItems, "Not configured", getSectionNotes("vtr"))}

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <a href={`/lists/${id}/specs`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors group">
              <div className="flex items-center gap-3">
                {dot(!!specs || (listLuts !== null && listLuts.length > 0))}
                <div>
                  <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">Shoot specs</h3>
                  {specs ? (
                    <p className="text-zinc-500 text-xs mt-0.5">{[specs.format, specs.resolution, specs.fps, specs.aspect_ratio, ...(listLuts && listLuts.length > 0 ? [listLuts.map((l: any) => l.name).join(", ")] : [])].filter(Boolean).join(" · ")}</p>
                  ) : (
                    <p className="text-zinc-700 text-xs mt-0.5">Not configured</p>
                  )}
                </div>
              </div>
              {arrow}
            </a>
          </div>

          <a href={`/lists/${id}/files`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-colors group">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {dot(files !== null && files.length > 0)}
                <div>
                  <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">Files</h3>
                  <p className="text-zinc-600 text-xs mt-0.5">{files && files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "No files attached"}</p>
                </div>
              </div>
              {arrow}
            </div>
            {files && files.length > 0 && (
              <div className="px-6 pb-4 border-t border-zinc-800 pt-3 space-y-0.5">
                {files.map((f: any) => <p key={f.id} className="text-zinc-400 text-xs">{f.name}</p>)}
              </div>
            )}
          </a>

          <a href={`/lists/${id}/other-kit`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-colors group">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {dot(!!getSectionNotes("other_kit"))}
                <div>
                  <h3 className="text-white font-semibold group-hover:text-[#FFE135] transition-colors">Other Kit</h3>
                  <p className="text-zinc-600 text-xs mt-0.5">{getSectionNotes("other_kit") ? "Notes added" : "Anything else not covered above"}</p>
                </div>
              </div>
              {arrow}
            </div>
          </a>

        </div>
      </main>
    </div>
  )
}
