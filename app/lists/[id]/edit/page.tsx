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
      house_id: houseId || null
    }).eq('id', listId)
    setSaving(false)
    router.push('/lists/' + listId)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Cancel</a>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Edit job details</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Project name</label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Production company</label>
            <input type="text" value={productionCo} onChange={e => setProductionCo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Shoot start date</label>
              <input type="date" value={shootStart} onChange={e => setShootStart(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Shoot days</label>
              <input type="number" min="1" value={shootDays} onChange={e => setShootDays(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Rental house</label>
            <select value={houseId} onChange={e => setHouseId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400">
              <option value="">Select rental house (optional)</option>
              {rentalHouses.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}{h.city ? " — " + h.city : ""}</option>
              ))}
            </select>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-orange-400 hover:bg-orange-300 text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </main>
    </div>
  )
}
