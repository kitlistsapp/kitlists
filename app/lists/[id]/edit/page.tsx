'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [productionCo, setProductionCo] = useState('')
  const [shootStart, setShootStart] = useState('')
  const [shootDays, setShootDays] = useState('')
  const [houseId, setHouseId] = useState('')
  const [rentalHouses, setRentalHouses] = useState<any[]>([])
  const [directorName, setDirectorName] = useState('')
  const [preLightDate, setPreLightDate] = useState('')
  const [gearCheckDate, setGearCheckDate] = useState('')
  const [testingDate, setTestingDate] = useState('')
  const [postReturnDate, setPostReturnDate] = useState('')

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: list }, { data: houses }] = await Promise.all([
      supabase.from('gear_lists').select('*').eq('id', lid).single(),
      supabase.from('rental_houses').select('*').order('name')
    ])
    if (list) {
      setProjectName(list.project_name || '')
      setProductionCo(list.production_co || '')
      setShootStart(list.shoot_start || '')
      setShootDays(String(list.shoot_days || ''))
      setHouseId(list.house_id || '')
      setDirectorName(list.director_name || '')
      setPreLightDate(list.pre_light_date || '')
      setGearCheckDate(list.gear_check_date || '')
      setTestingDate(list.testing_date || '')
      setPostReturnDate(list.post_return_date || '')
    }
    if (houses) setRentalHouses(houses)
  }

  const save = async () => {
    if (!projectName.trim()) return
    setSaving(true)
    await supabase.from('gear_lists').update({
      project_name: projectName.trim(),
      production_co: productionCo.trim(),
      shoot_start: shootStart || null,
      shoot_days: shootDays ? parseInt(shootDays) : null,
      house_id: houseId || null,
      director_name: directorName.trim() || null,
      pre_light_date: preLightDate || null,
      gear_check_date: gearCheckDate || null,
      testing_date: testingDate || null,
      post_return_date: postReturnDate || null
    }).eq('id', listId)
    setSaving(false)
    router.push('/lists/' + listId)
  }

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
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Production company</label>
            <input type="text" value={productionCo} onChange={e => setProductionCo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Shoot start date</label>
              <input type="date" min={new Date().toISOString().split("T")[0]} value={shootStart} onChange={e => setShootStart(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Shoot days</label>
              <input type="number" min="1" value={shootDays} onChange={e => setShootDays(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Rental house</label>
            <select value={houseId} onChange={e => setHouseId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]">
              <option value="">Select rental house (optional)</option>
              {rentalHouses.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}{h.city ? " — " + h.city : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Director</label>
            <input type="text" value={directorName} onChange={e => setDirectorName(e.target.value)}
              placeholder="e.g. Sandy Doe"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Pre-light date</label>
              <input type="date" value={preLightDate} onChange={e => setPreLightDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Gear check date</label>
              <input type="date" value={gearCheckDate} onChange={e => setGearCheckDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Testing date</label>
              <input type="date" value={testingDate} onChange={e => setTestingDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Post / return date</label>
              <input type="date" value={postReturnDate} onChange={e => setPostReturnDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>
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
