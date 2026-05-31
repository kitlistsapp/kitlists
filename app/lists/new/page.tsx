'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"


function RentalHousePicker({ houses, value, onChange }: {
  houses: any[]; value: string; onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = houses.find(h => h.id === value)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-zinc-800 border border-zinc-700 text-left rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] flex items-center justify-between">
        <span className={selected ? 'text-white' : 'text-zinc-500'}>{selected ? selected.name : 'Select rental house (optional)'}</span>
        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 border-b border-zinc-800">
            No rental house
          </button>
          {houses.map(h => (
            <button type="button" key={h.id} onClick={() => { onChange(h.id); setOpen(false) }}
              className={"w-full text-left px-4 py-2.5 text-sm transition-colors " + (value === h.id ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800')}>
              {h.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function TemplatePicker({ templates, value, onChange }: {
  templates: any[]; value: string; onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = templates.find(t => t.id === value)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-zinc-800 border border-zinc-700 text-left rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] flex items-center justify-between">
        <span className={selected ? 'text-white' : 'text-zinc-500'}>
          {selected ? (() => {
            const snap = selected.snapshot
            const camCount = snap?.cameras?.length || 0
            const lensCount = snap?.lensRows?.length || 0
            const itemCount = snap?.listItems?.length || 0
            return `${selected.name} — ${camCount} camera${camCount !== 1 ? 's' : ''}${lensCount > 0 ? `, ${lensCount} lenses` : ''}${itemCount > 0 ? `, ${itemCount} items` : ''}`
          })() : 'Select a template...'}
        </span>
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 border-b border-zinc-800">
            Select a template...
          </button>
          {templates.map(t => {
            const snap = t.snapshot
            const camCount = snap?.cameras?.length || 0
            const lensCount = snap?.lensRows?.length || 0
            const itemCount = snap?.listItems?.length || 0
            return (
              <button type="button" key={t.id} onClick={() => { onChange(t.id); setOpen(false) }}
                className={"w-full text-left px-4 py-2.5 text-sm transition-colors " + (value === t.id ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800')}>
                <span className="font-medium">{t.name}</span>
                <span className="text-zinc-500 ml-2 text-xs">{camCount} camera{camCount !== 1 ? 's' : ''}{lensCount > 0 ? `, ${lensCount} lenses` : ''}{itemCount > 0 ? `, ${itemCount} items` : ''}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NewListPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [mode, setMode] = useState<'scratch' | 'template'>('scratch')

  const [projectName, setProjectName] = useState("")
  const [productionCo, setProductionCo] = useState("")
  const [shootStart, setShootStart] = useState("")
  const [shootDays, setShootDays] = useState("")
  const [numCameras, setNumCameras] = useState("1")
  const [extraCameras, setExtraCameras] = useState("0")
  const [rentalHouse, setRentalHouse] = useState("")
  // const [rentalHouses, setRentalHouses] = useState<any[]>([])
  const [directorName, setDirectorName] = useState("")
  const [preLightDate, setPreLightDate] = useState("")
  const [gearCheckDate, setGearCheckDate] = useState("")
  const [testingDate, setTestingDate] = useState("")
  const [postReturnDate, setPostReturnDate] = useState("")

  const cameraLabels = ["A cam", "B cam", "C cam", "D cam", "E cam", "F cam"]

  useEffect(() => {
    const supabase2 = createClient()
    supabase2.from('templates').select('*').order('name').then(({ data: tmpls }) => {
      if (tmpls) setTemplates(tmpls)
    })
  }, [])

  const handleCreate = async () => {
    if (!projectName.trim()) { setError("Project name is required"); return }
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: list, error: listError } = await supabase
      .from("gear_lists")
      .insert({
        owner_id: user.id,
        project_name: projectName.trim(),
        production_co: productionCo.trim(),
        shoot_start: shootStart || null,
        shoot_days: parseInt(shootDays),
        rental_house: rentalHouse.trim() || null,
        status: "draft",
        director_name: directorName.trim() || null,
        pre_light_date: preLightDate || null,
        gear_check_date: gearCheckDate || null,
        testing_date: testingDate || null,
        post_return_date: postReturnDate || null
      })
      .select()
      .single()

    if (listError || !list) { setError(listError?.message || "Failed to create list"); setLoading(false); return }

    if (mode === 'template' && selectedTemplate) {
      const tmpl = templates.find(t => t.id === selectedTemplate)
      if (tmpl?.snapshot) {
        const snap = tmpl.snapshot
        if (snap.cameras) {
          for (const cam of snap.cameras) {
            const { data: newCam } = await supabase.from('camera_pages').insert({
              list_id: list.id, label: cam.label, sort_order: cam.sort_order,
              camera_body_id: cam.camera_body_id, camera_body_source: cam.camera_body_source,
              camera_notes: cam.camera_notes, camera_format: cam.camera_format
            }).select().single()
            if (newCam && cam.items?.length > 0) {
              await supabase.from('camera_page_items').insert(cam.items.map((i: any) => ({
                page_id: newCam.id, section: i.section, item_id: i.item_id,
                custom_label: i.custom_label, source: i.source, quantity: i.quantity
              })))
            }
          }
        }
        if (snap.lensRows?.length > 0) {
          await supabase.from('list_lenses').insert(snap.lensRows.map((l: any) => ({
            list_id: list.id, category: l.category, manufacturer: l.manufacturer,
            series: l.series, focal_length: l.focal_length, source: l.source, sort_order: l.sort_order
          })))
        }
        if (snap.listItems?.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase.from('list_items').insert(snap.listItems.map((i: any) => ({
            list_id: list.id, owner_id: user?.id, section: i.section, item_id: i.item_id,
            custom_label: i.custom_label, source: i.source, quantity: i.quantity, sort_order: i.sort_order
          })))
        }
        if (snap.sectionNotes?.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase.from('list_section_notes').insert(snap.sectionNotes.map((n: any) => ({
            list_id: list.id, owner_id: user?.id, section: n.section, notes: n.notes
          })))
        }
        if (snap.misc?.length > 0) {
          await supabase.from('list_misc_items').insert(snap.misc.map((i: any) => ({
            list_id: list.id, item_id: i.item_id, custom_label: i.custom_label, source: i.source, notes: i.notes
          })))
        }
        if (snap.specs) {
          await supabase.from('shoot_specs').insert({
            list_id: list.id, format: snap.specs.format, resolution: snap.specs.resolution,
            fps: snap.specs.fps, lut: snap.specs.lut, aspect_ratio: snap.specs.aspect_ratio,
            job_notes: snap.specs.job_notes
          })
        }
      }
    } else {
      const cameras = Array.from({ length: parseInt(numCameras) }, (_, i) => ({
        list_id: list.id, label: cameraLabels[i], sort_order: i
      }))
      await supabase.from("camera_pages").insert(cameras)
    }

    // Add extra cameras beyond template
    if (mode === 'template' && selectedTemplate && parseInt(extraCameras) > 0) {
      const tmpl = templates.find(t => t.id === selectedTemplate)
      const templateCamCount = tmpl?.snapshot?.cameras?.length || 0
      const extraCams = Array.from({ length: parseInt(extraCameras) }, (_, i) => ({
        list_id: list.id, label: cameraLabels[templateCamCount + i], sort_order: templateCamCount + i
      }))
      await supabase.from('camera_pages').insert(extraCams)
    }

    router.push("/lists/" + list.id)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Back to dashboard</a>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">New Gear List</h2>
          <p className="text-zinc-500 text-sm mt-1">Set up your project details</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">

          {templates.length > 0 && (
            <div>
              <label className="text-zinc-400 text-sm mb-2 block">Start from</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setMode('scratch')}
                  className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (mode === 'scratch' ? 'bg-[#FFE135] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}>
                  Scratch
                </button>
                <button onClick={() => setMode('template')}
                  className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (mode === 'template' ? 'bg-[#FFE135] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}>
                  Template
                </button>
              </div>
              {mode === 'template' && (
                <div className="space-y-3">
                  <TemplatePicker templates={templates} value={selectedTemplate} onChange={setSelectedTemplate} />
                  {selectedTemplate && (() => {
                    const tmpl = templates.find(t => t.id === selectedTemplate)
                    const snap = tmpl?.snapshot
                    if (!snap) return null
                    const camCount = snap.cameras?.length || 0
                    const lensCount = snap.lensRows?.length || 0
                    const sections = ['power','filtration','aks','head_tripod','grip','vtr'].filter(s =>
                      (snap.listItems || []).some((i: any) => i.section === s)
                    )
                    return (
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 space-y-1">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Template includes</p>
                        {camCount > 0 && <p className="text-sm text-zinc-300">{camCount} camera{camCount !== 1 ? 's' : ''}</p>}
                        {lensCount > 0 && <p className="text-sm text-zinc-300">{lensCount} lenses</p>}
                        {sections.map(s => (
                          <p key={s} className="text-sm text-zinc-300 capitalize">{s.replace('_', ' & ')}</p>
                        ))}
                        {snap.specs && <p className="text-sm text-zinc-300">Shoot specs</p>}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Project name <span className="text-[#FFE135]">*</span></label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Heartbreak High S3"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Production company</label>
            <input type="text" value={productionCo} onChange={e => setProductionCo(e.target.value)}
              placeholder="e.g. Fremantle Australia"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Director</label>
            <input type="text" value={directorName} onChange={e => setDirectorName(e.target.value)}
              placeholder="e.g. Sandy Doe"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Rental house</label>
            <input type="text" value={rentalHouse} onChange={e => setRentalHouse(e.target.value)}
              placeholder="e.g. Panavision Sydney"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>

          <div className="border-t border-zinc-700 pt-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Project dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Testing date</label>
                <input type="date" value={testingDate} onChange={e => setTestingDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Pre-light date</label>
                <input type="date" value={preLightDate} onChange={e => setPreLightDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Gear check date</label>
                <input type="date" value={gearCheckDate} onChange={e => setGearCheckDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Shoot start date</label>
                <input type="date" value={shootStart} onChange={e => setShootStart(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Shoot days</label>
                <input type="number" min="1" value={shootDays} onChange={e => setShootDays(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Post / return date</label>
                <input type="date" value={postReturnDate} onChange={e => setPostReturnDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark]" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Cameras</h3>
            {mode === 'scratch' && (
              <div>
                <label className="text-zinc-400 text-sm mb-3 block">Number of cameras</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} onClick={() => setNumCameras(String(n))}
                      className={"w-12 h-12 rounded-lg text-sm font-semibold transition-colors " + (numCameras === String(n) ? "bg-[#FFE135] text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-2">
                  Creates: {Array.from({ length: parseInt(numCameras) }, (_, i) => cameraLabels[i]).join(", ")}
                </p>
              </div>
            )}
            {mode === 'template' && selectedTemplate && (() => {
              const tmpl = templates.find(t => t.id === selectedTemplate)
              const templateCamCount = tmpl?.snapshot?.cameras?.length || 0
              const totalCams = templateCamCount + parseInt(extraCameras || '0')
              return (
                <div>
                  <p className="text-zinc-400 text-sm mb-3">
                    Template includes <span className="text-white font-medium">{templateCamCount} camera{templateCamCount !== 1 ? 's' : ''}</span>
                    {' '}({Array.from({ length: templateCamCount }, (_, i) => cameraLabels[i]).join(', ')})
                  </p>
                  <label className="text-zinc-400 text-sm mb-2 block">Add extra cameras?</label>
                  <div className="flex gap-2 flex-wrap">
                    {[0,1,2,3,4].map(n => (
                      <button key={n} onClick={() => setExtraCameras(String(n))}
                        className={"w-12 h-12 rounded-lg text-sm font-semibold transition-colors " + (extraCameras === String(n) ? "bg-[#FFE135] text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>
                        {n === 0 ? 'None' : '+' + n}
                      </button>
                    ))}
                  </div>
                  {parseInt(extraCameras) > 0 && (
                    <p className="text-zinc-600 text-xs mt-2">
                      Extra: {Array.from({ length: parseInt(extraCameras) }, (_, i) => cameraLabels[templateCamCount + i]).join(', ')}
                    </p>
                  )}
                </div>
              )
            })()}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleCreate} disabled={loading}
            className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
            {loading ? "Creating..." : "Create gear list"}
          </button>
        </div>
      </main>
    </div>
  )
}
