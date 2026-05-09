'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }

function SearchablePicker({ items, value, onChange, placeholder }: {
  items: Item[]
  value: string
  onChange: (id: string, name: string) => void
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)

  useEffect(() => { if (selected) setQuery(selected.name) }, [value, items])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.brand || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-800 dark:bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
        />
        {value && (
          <button onClick={() => { onChange('', ''); setQuery('') }}
            className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom
            </button>
          ) : (
            <>
              {Object.entries(grouped).map(([brand, brandItems]) => (
                <div key={brand}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{brand}</div>
                  {brandItems.map(item => (
                    <button key={item.id}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
                      onClick={() => { onChange(item.id, item.name); setQuery(item.name); setOpen(false) }}>
                      {item.name}
                    </button>
                  ))}
                </div>
              ))}
              {query && !filtered.find(i => i.name.toLowerCase() === query.toLowerCase()) && (
                <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 border-t border-zinc-800"
                  onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
                  + Add "{query}" as custom
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface PowerEntry { type: 'onboard' | 'block'; itemId: string; itemName: string; quantity: number }
interface AksEntry { id: string; category: string; itemId: string; itemName: string; quantity: number }
interface FiltEntry { itemId: string; itemName: string }

export default function CameraPageEditor({ params }: { params: Promise<{ id: string, cameraId: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [cameraLabel, setCameraLabel] = useState('')
  const [cameraFormat, setCameraFormat] = useState('digital')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])

  const [selectedBody, setSelectedBody] = useState('')
  const [bodySource, setBodySource] = useState('rental')
  const [cameraNotes, setCameraNotes] = useState('')

  const [powerMode, setPowerMode] = useState<'both' | 'onboard' | 'block'>('both')
  const [powerEntries, setPowerEntries] = useState<PowerEntry[]>([])

  const [aksEntries, setAksEntries] = useState<AksEntry[]>([{ id: '1', category: '', itemId: '', itemName: '', quantity: 1 }])

  const [filtEntries, setFiltEntries] = useState<FiltEntry[]>([{ itemId: '', itemName: '' }])
  const [gripEntries, setGripEntries] = useState<Array<{ itemId: string; itemName: string; quantity: number }>>([{ itemId: '', itemName: '', quantity: 1 }])

  useEffect(() => {
    params.then(p => { setListId(p.id); setCameraId(p.cameraId); loadData(p.id, p.cameraId) })
  }, [])

  const loadData = async (lid: string, cid: string) => {
    const [{ data: cam }, { data: eq }] = await Promise.all([
      supabase.from('camera_pages').select('*').eq('id', cid).single(),
      supabase.from('equipment_items').select('*').order('name')
    ])
    if (cam) {
      setCameraLabel(cam.label)
      setCameraFormat(cam.camera_format || 'digital')
      if (cam.camera_body_id) setSelectedBody(cam.camera_body_id)
      if (cam.camera_body_source) setBodySource(cam.camera_body_source)
      if (cam.camera_notes) setCameraNotes(cam.camera_notes)
    }
    if (eq) setAllItems(eq)
    const { data: items } = await supabase.from('camera_page_items').select('*, equipment_items(name, subcategory, category)').eq('page_id', cid)
    if (items && items.length > 0) {
      const power = items.filter((i: any) => i.section === 'power')
      if (power.length > 0) {
        setPowerEntries(power.map((i: any) => ({
          type: i.equipment_items?.subcategory === 'block' ? 'block' : 'onboard',
          itemId: i.item_id || '',
          itemName: i.equipment_items?.name || i.custom_label || '',
          quantity: i.quantity || 1
        })))
      }
      const aks = items.filter((i: any) => i.section === 'aks')
      if (aks.length > 0) {
        setAksEntries(aks.map((i: any, idx: number) => ({
          id: String(idx),
          category: i.equipment_items?.subcategory || '',
          itemId: i.item_id || '',
          itemName: i.equipment_items?.name || i.custom_label || '',
          quantity: i.quantity || 1
        })))
      }
      const filt = items.filter((i: any) => i.section === 'filtration')
      if (filt.length > 0) {
        setFiltEntries(filt.map((i: any) => ({ itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '' })))
      }
      const grip = items.filter((i: any) => i.section === 'grip')
      if (grip.length > 0) {
        setGripEntries(grip.map((i: any) => ({ itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1 })))
      }
    }
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('camera_pages').update({ camera_body_id: selectedBody && !selectedBody.startsWith('custom:') ? selectedBody : null, camera_body_source: bodySource, camera_notes: cameraNotes, camera_format: cameraFormat }).eq('id', cameraId)
    await supabase.from('camera_page_items').delete().eq('page_id', cameraId)
    const rows: any[] = []
    powerEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'power', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity, source: 'rental' }))
    aksEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'aks', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity, source: 'rental' }))
    filtEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'filtration', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: 1, source: 'rental' }))
    gripEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'grip', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity, source: 'rental' }))
    if (rows.length > 0) await supabase.from('camera_page_items').insert(rows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const bodies = allItems.filter(i => i.category === 'body')
  const onboardItems = allItems.filter(i => i.category === 'power' && i.subcategory === 'onboard')
  const blockItems = allItems.filter(i => i.category === 'power' && i.subcategory === 'block')
  const filtrationItems = allItems.filter(i => i.category === 'filtration')
  const gripItems = allItems.filter(i => i.category === 'grip')
  const aksCategories = [...new Set(allItems.filter(i => i.category === 'aks').map(i => i.subcategory || 'Other'))]

  const addPowerEntry = (type: 'onboard' | 'block') => {
    setPowerEntries(prev => [...prev, { type, itemId: '', itemName: '', quantity: 1 }])
  }

  const updatePower = (idx: number, field: string, value: any) => {
    setPowerEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const removePower = (idx: number) => {
    setPowerEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const addAks = () => {
    setAksEntries(prev => [...prev, { id: Date.now().toString(), category: '', itemId: '', itemName: '', quantity: 1 }])
  }

  const updateAks = (idx: number, field: string, value: any) => {
    setAksEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const removeAks = (idx: number) => {
    setAksEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const addFilt = () => setFiltEntries(prev => [...prev, { itemId: '', itemName: '' }])
  const removeFilt = (idx: number) => setFiltEntries(prev => prev.filter((_, i) => i !== idx))

  const addGrip = () => setGripEntries(prev => [...prev, { itemId: '', itemName: '', quantity: 1 }])
  const removeGrip = (idx: number) => setGripEntries(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">{cameraLabel}</h2>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Camera body</h3>
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                <button onClick={() => setCameraFormat('digital')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${ cameraFormat === 'digital' ? 'bg-orange-400 text-black' : 'text-zinc-400 hover:text-white' }`}>Digital</button>
                <button onClick={() => setCameraFormat('film')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${ cameraFormat === 'film' ? 'bg-orange-400 text-black' : 'text-zinc-400 hover:text-white' }`}>Film</button>
              </div>
            </div>
            <SearchablePicker items={bodies} value={selectedBody} onChange={(id) => setSelectedBody(id)} placeholder="Search camera bodies..." />
            {selectedBody && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setBodySource('rental')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ bodySource === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>Rental house</button>
                <button onClick={() => setBodySource('dop_owned')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ bodySource === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>DOP owned</button>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Power</h3>
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                {(['both', 'onboard', 'block'] as const).map(m => (
                  <button key={m} onClick={() => setPowerMode(m)} className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${ powerMode === m ? 'bg-orange-400 text-black' : 'text-zinc-400 hover:text-white' }`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {powerEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ entry.type === 'onboard' ? 'bg-blue-900 text-blue-400' : 'bg-amber-900 text-amber-400' }`}>{entry.type}</span>
                    </div>
                    <SearchablePicker
                      items={entry.type === 'onboard' ? onboardItems : blockItems}
                      value={entry.itemId}
                      onChange={(id, name) => updatePower(idx, 'itemId', id) || updatePower(idx, 'itemName', name)}
                      placeholder={entry.type === 'onboard' ? 'Select battery type...' : 'Select block battery...'}
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-zinc-600 text-xs block mb-1">Qty</label>
                    <input type="number" min="1" value={entry.quantity}
                      onChange={e => updatePower(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <button onClick={() => removePower(idx)} className="mt-6 text-zinc-600 hover:text-red-400 transition-colors text-lg">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              {(powerMode === 'both' || powerMode === 'onboard') && (
                <button onClick={() => addPowerEntry('onboard')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add onboard</button>
              )}
              {(powerMode === 'both' || powerMode === 'block') && (
                <button onClick={() => addPowerEntry('block')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add block</button>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Grip</h3>
            <div className="space-y-3">
              {gripEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <SearchablePicker items={gripItems} value={entry.itemId} onChange={(id, name) => { const u = [...gripEntries]; u[idx] = { ...u[idx], itemId: id, itemName: name }; setGripEntries(u) }} placeholder="Search grip items..." />
                  </div>
                  <div className="w-20">
                    <input type="number" min="1" value={entry.quantity}
                      onChange={e => { const u = [...gripEntries]; u[idx].quantity = parseInt(e.target.value) || 1; setGripEntries(u) }}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <button onClick={() => removeGrip(idx)} className="text-zinc-600 hover:text-red-400 transition-colors text-lg pb-2">×</button>
                </div>
              ))}
            </div>
            <button onClick={addGrip} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add grip item</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">AKS</h3>
            <div className="space-y-4">
              {aksEntries.map((entry, idx) => (
                <div key={entry.id} className="border border-zinc-800 rounded-xl p-4 relative">
                  <button onClick={() => removeAks(idx)} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 transition-colors text-lg">×</button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-zinc-600 text-xs mb-1 block">Category</label>
                      <select value={entry.category} onChange={e => updateAks(idx, 'category', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400">
                        <option value="">Select category</option>
                        {aksCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-600 text-xs mb-1 block">Qty</label>
                      <input type="number" min="1" value={entry.quantity}
                        onChange={e => updateAks(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>
                  {entry.category && (
                    <div>
                      <label className="text-zinc-600 text-xs mb-1 block">Item</label>
                      <SearchablePicker
                        items={allItems.filter(i => i.category === 'aks' && i.subcategory === entry.category)}
                        value={entry.itemId}
                        onChange={(id, name) => updateAks(idx, 'itemId', id) || updateAks(idx, 'itemName', name)}
                        placeholder={`Search ${entry.category}...`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addAks} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add AKS item</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Filtration</h3>
            <div className="space-y-3">
              {filtEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <SearchablePicker items={filtrationItems} value={entry.itemId} onChange={(id, name) => { const u = [...filtEntries]; u[idx] = { itemId: id, itemName: name }; setFiltEntries(u) }} placeholder="Search filtration..." />
                  </div>
                  <button onClick={() => removeFilt(idx)} className="text-zinc-600 hover:text-red-400 transition-colors text-lg pb-2">×</button>
                </div>
              ))}
            </div>
            <button onClick={addFilt} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add filter</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Camera notes</h3>
            <textarea value={cameraNotes} onChange={e => setCameraNotes(e.target.value)}
              placeholder="e.g. Steadicam, Ronin, handheld, operator notes..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none" />
          </div>

        </div>
      </main>
    </div>
  )
}