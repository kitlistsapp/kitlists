import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('list_shares')
    .select('*, gear_lists(*, rental_houses(name))')
    .eq('token', token)
    .single()

  if (!share) notFound()

  const list = share.gear_lists as any
  const isProduction = share.view_mode === 'production_clean'

  const { data: cameras } = await supabase
    .from('camera_pages')
    .select('*, equipment_items(name)')
    .eq('list_id', list.id)
    .order('sort_order')

  const camItems = await Promise.all((cameras || []).map(async (cam: any) => {
    const { data: items } = await supabase
      .from('camera_page_items')
      .select('*, equipment_items(name)')
      .eq('page_id', cam.id)
    return { ...cam, items: items || [] }
  }))

  const { data: lenses } = await supabase
    .from('list_lenses')
    .select('*, equipment_items(name), list_lens_zooms(*, equipment_items(name))')
    .eq('list_id', list.id)
    .maybeSingle()

  const { data: misc } = await supabase
    .from('list_misc_items')
    .select('*, equipment_items(name)')
    .eq('list_id', list.id)

  const { data: specs } = await supabase
    .from('shoot_specs')
    .select('*')
    .eq('list_id', list.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Kit<span className="text-orange-400">List</span></h1>
        <span className="text-zinc-600 text-xs uppercase tracking-widest">
          {isProduction ? 'Production view' : share.role === 'rental' ? 'Rental house view' : 'Crew view'}
        </span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{list.project_name}</h2>
          <p className="text-zinc-500 text-sm mt-1">{list.production_co}</p>
          <div className="flex gap-4 mt-2 text-xs text-zinc-600">
            {list.shoot_start && <span>Shoot: {new Date(list.shoot_start).toLocaleDateString('en-AU')}</span>}
            {list.shoot_days && <span>{list.shoot_days} days</span>}
            {list.rental_houses?.name && <span>{list.rental_houses.name}</span>}
          </div>
        </div>

        {specs && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Shoot specs</h3>
            <div className="flex flex-wrap gap-3">
              {specs.format && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.format}</span>}
              {specs.resolution && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.resolution}</span>}
              {specs.fps && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.fps}</span>}
              {specs.lut && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.lut}</span>}
              {specs.aspect_ratio && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.aspect_ratio}</span>}
            </div>
            {specs.job_notes && <p className="text-zinc-500 text-sm mt-3">{specs.job_notes}</p>}
          </div>
        )}

        <div className="space-y-4">
          {camItems.map((cam: any) => {
            const bodyName = cam.equipment_items?.name
            if (!bodyName && cam.items.length === 0) return null
            const powerItems = cam.items.filter((i: any) => i.section === 'power')
            const aksItems = cam.items.filter((i: any) => i.section === 'aks')
            const gripItems = cam.items.filter((i: any) => i.section === 'grip')
            const filtItems = cam.items.filter((i: any) => i.section === 'filtration')
            return (
              <div key={cam.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{cam.label}</h3>
                  {!isProduction && cam.camera_body_source === 'dop_owned' && (
                    <span className="text-xs bg-orange-950 text-orange-400 px-2.5 py-1 rounded-full">DOP owned</span>
                  )}
                  {isProduction && cam.camera_body_source === 'dop_owned' && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full">Supplied</span>
                  )}
                </div>
                {bodyName && <p className="text-white font-medium mb-4">{bodyName}</p>}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {powerItems.length > 0 && (
                    <div>
                      <span className="text-zinc-600 text-xs uppercase tracking-wider">Power</span>
                      {powerItems.map((i: any) => (
                        <p key={i.id} className="text-zinc-300 text-sm mt-1">{i.equipment_items?.name || i.custom_label}</p>
                      ))}
                    </div>
                  )}
                  {aksItems.length > 0 && (
                    <div>
                      <span className="text-zinc-600 text-xs uppercase tracking-wider">AKS</span>
                      {aksItems.map((i: any) => (
                        <p key={i.id} className="text-zinc-300 text-sm mt-1">{i.equipment_items?.name || i.custom_label}</p>
                      ))}
                    </div>
                  )}
                  {gripItems.length > 0 && (
                    <div className="mt-2">
                      <span className="text-zinc-600 text-xs uppercase tracking-wider">Grip</span>
                      {gripItems.map((i: any) => (
                        <p key={i.id} className="text-zinc-300 text-sm mt-1">{i.equipment_items?.name || i.custom_label}</p>
                      ))}
                    </div>
                  )}
                  {filtItems.length > 0 && (
                    <div className="mt-2">
                      <span className="text-zinc-600 text-xs uppercase tracking-wider">Filtration</span>
                      {filtItems.map((i: any) => (
                        <p key={i.id} className="text-zinc-300 text-sm mt-1">{i.equipment_items?.name || i.custom_label}</p>
                      ))}
                    </div>
                  )}
                </div>
                {cam.camera_notes && (
                  <p className="text-zinc-500 text-sm mt-4 pt-4 border-t border-zinc-800">{cam.camera_notes}</p>
                )}
                {share.role === 'rental' && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Rental house notes</p>
                    <p className="text-zinc-400 text-sm">{cam.rental_notes || 'No notes added'}</p>
                  </div>
                )}
              </div>
            )
          })}

          {lenses && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Lenses</h3>
                {!isProduction && lenses.source === 'dop_owned' && (
                  <span className="text-xs bg-orange-950 text-orange-400 px-2.5 py-1 rounded-full">DOP owned</span>
                )}
                {isProduction && lenses.source === 'dop_owned' && (
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full">Supplied</span>
                )}
              </div>
              {lenses.equipment_items?.name && <p className="text-white font-medium mb-3">{lenses.equipment_items.name}</p>}
              {lenses.focal_lengths?.length > 0 && (
                <p className="text-zinc-400 text-sm mb-2">Focal lengths: {lenses.focal_lengths.join(', ')}</p>
              )}
              {lenses.list_lens_zooms?.map((z: any) => (
                <p key={z.id} className="text-zinc-400 text-sm">{z.equipment_items?.name}</p>
              ))}
              {lenses.zoom_controller && (
                <p className="text-zinc-500 text-sm mt-2">Controller: {lenses.zoom_controller}</p>
              )}
            </div>
          )}

          {misc && misc.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Misc AKS</h3>
              <div className="space-y-2">
                {misc.filter((i: any) => !isProduction || i.source !== 'dop_owned' || true).map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}</span>
                      {i.notes && <span className="text-zinc-600 text-xs ml-2">{i.notes}</span>}
                    </div>
                    {!isProduction && i.source === 'dop_owned' && (
                      <span className="text-xs bg-orange-950 text-orange-400 px-2 py-0.5 rounded-full">DOP owned</span>
                    )}
                    {isProduction && i.source === 'dop_owned' && (
                      <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">Supplied</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}