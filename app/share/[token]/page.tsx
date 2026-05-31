import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import DownloadButtons from "./DownloadButtons"

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('list_shares')
    .select('*, gear_lists(*, rental_houses(name), profiles(full_name, company_name, phone, company_logo_url))')
    .eq('token', token)
    .single()

  if (!share) notFound()

  const list = share.gear_lists as any
  const dop = list.profiles as any
  const isProduction = share.view_mode === 'production_clean'

  let logoUrl = null
  if (dop?.company_logo_url) {
    const { data: signed } = await supabase.storage.from('logos').createSignedUrl(dop.company_logo_url, 3600)
    if (signed) logoUrl = signed.signedUrl
  }

  const { data: cameras } = await supabase.from('camera_pages').select('*, equipment_items(name)').eq('list_id', list.id).order('sort_order')
  const { data: lensRows } = await supabase.from('list_lenses').select('*').eq('list_id', list.id).order('sort_order')
  const { data: listItems } = await supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', list.id).order('sort_order')
  const { data: sectionNotesList } = await supabase.from('list_section_notes').select('*').eq('list_id', list.id)
  const { data: specs } = await supabase.from('shoot_specs').select('*').eq('list_id', list.id).maybeSingle()

  const powerItems = (listItems || []).filter((i: any) => i.section === 'power')
  const headTripodItems = (listItems || []).filter((i: any) => i.section === 'head_tripod')
  const gripItems = (listItems || []).filter((i: any) => i.section === 'grip')
  const gimbalItems = gripItems
  const vtrItems = (listItems || []).filter((i: any) => i.section === 'vtr')
  const filtrationItems = (listItems || []).filter((i: any) => i.section === 'filtration')
  const aksItems = (listItems || []).filter((i: any) => i.section === 'aks')
  const getSectionNote = (section: string) => (sectionNotesList || []).find((n: any) => n.section === section)?.notes || ''

  const { data: listLuts } = await supabase.from('list_lut_files').select('*, user_luts(file_url)').eq('list_id', list.id)
  const lutsWithUrls = await Promise.all((listLuts || []).map(async (lut: any) => {
    const filePath = lut.file_path || lut.user_luts?.file_url
    if (filePath) {
      const { data: signed } = await supabase.storage.from('luts').createSignedUrl(filePath, 3600)
      return { ...lut, signedUrl: signed?.signedUrl || null }
    }
    return { ...lut, signedUrl: null }
  }))

  const isAC = share.role === 'ac'
  const { data: listFiles } = isAC ? await supabase.from('list_files').select('*').eq('list_id', list.id).order('created_at') : { data: [] }
  const filesWithUrls = await Promise.all((listFiles || []).map(async (file: any) => {
    if (file.file_path) {
      const { data: signed } = await supabase.storage.from('list-files').createSignedUrl(file.file_path, 3600)
      return { ...file, signedUrl: signed?.signedUrl || null }
    }
    return { ...file, signedUrl: null }
  }))

  const listData = { list, cameras: cameras || [], lenses: lensRows || [], specs, powerItems, headTripodItems, gripItems, filtrationItems, aksItems }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-white">Kit<span className="text-[#FFE135]">Lists</span></a>
        <span className="text-zinc-600 text-xs uppercase tracking-widest">
          {isProduction ? 'Production view' : share.role === 'rental' ? 'Rental house view' : 'Crew view'}
        </span>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {dop && (
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800">
            {logoUrl && <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-contain bg-zinc-900 p-1 border border-zinc-800" />}
            <div>
              {dop.full_name && <p className="text-white font-semibold">{dop.full_name}</p>}
              {dop.company_name && <p className="text-zinc-500 text-sm">{dop.company_name}</p>}
              {dop.phone && <p className="text-zinc-600 text-xs mt-0.5">{dop.phone}</p>}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold">{list.project_name}</h2>
          <p className="text-zinc-500 text-sm mt-1">{list.production_co}</p>
          <div className="flex gap-4 mt-2 text-xs text-zinc-600">
            {list.shoot_start && <span>Shoot: {new Date(list.shoot_start).toLocaleDateString('en-AU')}</span>}
            {list.shoot_days && <span>{list.shoot_days} days</span>}
            {list.rental_houses?.name && <span>{list.rental_houses.name}</span>}
          </div>
          <DownloadButtons listData={listData} dopName={dop?.full_name || ''} companyName={dop?.company_name || ''} luts={lutsWithUrls} />
        </div>


        <div className="space-y-4">

          {/* Camera bodies */}
          {(cameras || []).filter((cam: any) => cam.equipment_items?.name).map((cam: any) => (
            <div key={cam.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3">{cam.label}</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white font-medium">{cam.equipment_items?.name}</p>
                {!isProduction && cam.camera_body_source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-2 py-0.5 rounded-full">DOP owned</span>}
                {!isProduction && cam.camera_body_source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full">AC owned</span>}
                {isProduction && (cam.camera_body_source === 'dop_owned' || cam.camera_body_source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">Supplied</span>}
              </div>
              {cam.camera_notes && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{cam.camera_notes}</p>}
              {share.role === 'rental' && <div className="mt-3 pt-3 border-t border-zinc-800"><p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Rental house notes</p><p className="text-zinc-400 text-sm">{cam.rental_notes || 'No notes added'}</p></div>}
            </div>
          ))}

          {/* Power */}
          {powerItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Power</h3>
              <div className="space-y-2">
                {powerItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('power') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('power')}</p>}
            </div>
          )}

          {/* Lenses */}
          {(lensRows || []).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Lenses</h3>
              <div className="space-y-2">
                {Object.entries((lensRows || []).reduce((acc: Record<string, any[]>, l: any) => {
                  if (!acc[l.category]) acc[l.category] = []
                  acc[l.category].push(l)
                  return acc
                }, {})).map(([cat, lenses]: [string, any[]]) => (
                  <div key={cat} className="mb-3 last:mb-0">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{cat}</p>
                    {lenses.map((l: any) => (
                      <div key={l.id} className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-300 text-sm">{l.manufacturer} {l.series} <span className="text-[#FFE135]">{l.focal_length}</span></span>
                        {!isProduction && l.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                        {!isProduction && l.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                        {isProduction && (l.source === 'dop_owned' || l.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {getSectionNote('lenses') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('lenses')}</p>}
            </div>
          )}

          {/* Filtration */}
          {filtrationItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Filtration</h3>
              <div className="space-y-2">
                {filtrationItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('filtration') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('filtration')}</p>}
            </div>
          )}

          {/* AKS */}
          {aksItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">AKS</h3>
              <div className="space-y-2">
                {aksItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('aks') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('aks')}</p>}
            </div>
          )}

          {/* Head & Legs */}
          {headTripodItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Head & Legs</h3>
              <div className="space-y-2">
                {headTripodItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('head_tripod') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('head_tripod')}</p>}
            </div>
          )}

          {/* Gimbals */}
          {gimbalItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Gimbals</h3>
              <div className="space-y-2">
                {gimbalItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('grip') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('grip')}</p>}
            </div>
          )}

          {/* VTR */}
          {vtrItems.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">VTR</h3>
              <div className="space-y-2">
                {vtrItems.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm">{i.equipment_items?.name || i.custom_label}{i.quantity > 1 ? ` x${i.quantity}` : ''}</span>
                    {!isProduction && i.source === 'dop_owned' && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-1.5 py-0.5 rounded-full">DOP owned</span>}
                    {!isProduction && i.source === 'ac_owned' && <span className="text-xs bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded-full">AC owned</span>}
                    {isProduction && (i.source === 'dop_owned' || i.source === 'ac_owned') && <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">Supplied</span>}
                  </div>
                ))}
              </div>
              {getSectionNote('vtr') && <p className="text-zinc-500 text-sm mt-3 pt-3 border-t border-zinc-800">{getSectionNote('vtr')}</p>}
            </div>
          )}

          {/* Other Kit */}
          {getSectionNote('other_kit') && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Other Kit</h3>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{getSectionNote('other_kit')}</p>
            </div>
          )}

          {/* Shoot Specs */}
          {specs && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Shoot specs</h3>
              <div className="flex flex-wrap gap-2">
                {specs.format && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.format}</span>}
                {specs.resolution && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.resolution}</span>}
                {specs.fps && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.fps}</span>}
                {lutsWithUrls && lutsWithUrls.length > 0 && lutsWithUrls.map((l: any) => <span key={l.id} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{l.name}</span>)}
                {specs.aspect_ratio && <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{specs.aspect_ratio}</span>}
              </div>
              {specs.job_notes && <p className="text-zinc-500 text-sm mt-3">{specs.job_notes}</p>}
            </div>
          )}

          {/* LUT Files — AC only */}
          {isAC && lutsWithUrls && lutsWithUrls.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">LUT Files</h3>
              <div className="space-y-2">
                {lutsWithUrls.map((lut: any) => (
                  <div key={lut.id} className="flex items-center justify-between">
                    <span className="text-zinc-300 text-sm">{lut.name}</span>
                    {lut.signedUrl && <a href={lut.signedUrl} download className="text-xs bg-zinc-800 hover:bg-zinc-700 text-[#FFE135] px-3 py-1.5 rounded-lg transition-colors">Download</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files — AC only */}
          {isAC && filesWithUrls && filesWithUrls.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Files</h3>
              <div className="space-y-2">
                {filesWithUrls.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between">
                    <span className="text-zinc-300 text-sm">{file.name}</span>
                    {file.signedUrl && <a href={file.signedUrl} download className="text-xs bg-zinc-800 hover:bg-zinc-700 text-[#FFE135] px-3 py-1.5 rounded-lg transition-colors">Download</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800">
          <p className="text-zinc-700 text-xs text-center">Powered by KitLists</p>
        </div>
      </main>
    </div>
  )
}