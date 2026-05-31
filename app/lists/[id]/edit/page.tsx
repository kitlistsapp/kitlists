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

export default function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [productionCo, setProductionCo] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [rentalHouse, setRentalHouse] = useState('')
  // const [rentalHouses, setRentalHouses] = useState<any[]>([])
  const [testingDate, setTestingDate] = useState('')
  const [preLightDate, setPreLightDate] = useState('')
  const [gearCheckDate, setGearCheckDate] = useState('')
  const [shootStart, setShootStart] = useState('')
  const [shootDays, setShootDays] = useState('')
  const [postReturnDate, setPostReturnDate] = useState('')
  const [numCameras, setNumCameras] = useState(1)
  const [cameras, setCameras] = useState<any[]>([])
  const cameraLabels = ["A cam", "B cam", "C cam", "D cam", "E cam", "F cam"]

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: list }, { data: houses }, { data: cams }] = await Promise.all([
      supabase.from('gear_lists').select('*').eq('id', lid).single(),
      supabase.from('rental_houses').select('*').order('sort_order').limit(0),
      supabase.from('camera_pages').select('*').eq('list_id', lid).order('sort_order')
    ])
    if (list) {
      setProjectName(list.project_name || '')
      setProductionCo(list.production_co || '')
      setDirectorName(list.director_name || '')
      setRentalHouse(list.rental_house || '')
      setShootStart(list.shoot_start || '')
      setShootDays(String(list.shoot_days || ''))
      setTestingDate(list.testing_date || '')
      setPreLightDate(list.pre_light_date || '')
      setGearCheckDate(list.gear_check_date || '')
      setPostReturnDate(list.post_return_date || '')
    }
    // rental houses removed
    if (cams) { setCameras(cams); setNumCameras(cams.length) }
  }

  const save = async () => {
    if (!projectName.trim()) return
    setSaving(true)
    await supabase.from('gear_lists').update({
      project_name: projectName.trim(),
      production_co: productionCo.trim(),
      director_name: directorName.trim() || null,
      rental_house: rentalHouse.trim() || null,
      shoot_start: shootStart || null,
      shoot_days: shootDays ? parseInt(shootDays) : null,
      testing_date: testingDate || null,
      pre_light_date: preLightDate || null,
      gear_check_date: gearCheckDate || null,
      post_return_date: postReturnDate || null
    }).eq('id', listId)

    // Handle camera changes
    const currentCount = cameras.length
    if (numCameras > currentCount) {
      const newCams = Array.from({ length: numCameras - currentCount }, (_, i) => ({
        list_id: listId, label: cameraLabels[currentCount + i], sort_order: currentCount + i
      }))
      await supabase.from('camera_pages').insert(newCams)
    } else if (numCameras < currentCount) {
      const toDelete = cameras.slice(numCameras).map((c: any) => c.id)
      await supabase.from('camera_pages').delete().in('id', toDelete)
    }

    setSaving(false)
    router.push('/lists/' + listId)
  }

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]"
  const dateClass = "w-full min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFE135] [color-scheme:dark] appearance-none"

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Cancel</a>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Edit job details</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Project name</label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Production company</label>
            <input type="text" value={productionCo} onChange={e => setProductionCo(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Director</label>
            <input type="text" value={directorName} onChange={e => setDirectorName(e.target.value)} placeholder="e.g. Sandy Doe" className={inputClass} />
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
                <input type="date" value={testingDate} onChange={e => setTestingDate(e.target.value)} className={dateClass} />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Pre-light date</label>
                <input type="date" value={preLightDate} onChange={e => setPreLightDate(e.target.value)} className={dateClass} />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Gear check date</label>
                <input type="date" value={gearCheckDate} onChange={e => setGearCheckDate(e.target.value)} className={dateClass} />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Shoot start date</label>
                <input type="date" value={shootStart} onChange={e => setShootStart(e.target.value)} className={dateClass} />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Shoot days</label>
                <input type="number" min="1" value={shootDays} onChange={e => setShootDays(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Post / return date</label>
                <input type="date" value={postReturnDate} onChange={e => setPostReturnDate(e.target.value)} className={dateClass} />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Cameras</h3>
            <label className="text-zinc-400 text-sm mb-3 block">Number of cameras</label>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => setNumCameras(n)}
                  className={"w-12 h-12 rounded-lg text-sm font-semibold transition-colors " + (numCameras === n ? "bg-[#FFE135] text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-2">
              {numCameras > cameras.length ? `Will add: ${cameraLabels.slice(cameras.length, numCameras).join(", ")}` :
               numCameras < cameras.length ? `Will remove: ${cameras.slice(numCameras).map((c: any) => c.label).join(", ")}` :
               `${cameraLabels.slice(0, numCameras).join(", ")}`}
            </p>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </main>
    </div>
  )
}
