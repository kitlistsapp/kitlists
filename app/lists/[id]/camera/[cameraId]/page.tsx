'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabaseClient = createClient()

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }
interface SectionEntry { id: string; itemId: string; itemName: string; quantity: number; source: string }
interface PowerEntry { type: 'onboard' | 'block' | 'acdc'; itemId: string; itemName: string; quantity: number; source: string }

import { useRef } from "react"

function SearchablePicker({ items, value, onChange, placeholder }: {
  items: Item[]; value: string; onChange: (id: string, name: string) => void; placeholder: string
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
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
        />
        {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
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

function SectionList({ title, items, entries, setEntries }: {
  title: string; items: Item[]
  entries: SectionEntry[]; setEntries: (v: SectionEntry[]) => void
}) {
  const add = () => setEntries([...entries, { id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const remove = (id: string) => setEntries(entries.filter(e => e.id !== id))
  const update = (id: string, field: string, value: any) => setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="space-y-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <SearchablePicker items={items} value={entry.itemId}
                  onChange={(id, name) => { update(entry.id, 'itemId', id); update(entry.id, 'itemName', name) }}
                  placeholder={"Search " + title.toLowerCase() + "..."} />
              </div>
              <div className="w-16">
                <input type="number" min="1" placeholder=""
                  value={entry.quantity === 0 ? '' : entry.quantity}
                  onChange={e => update(entry.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <button onClick={() => remove(entry.id)} className="text-zinc-600 hover:text-red-400 text-lg pb-1">×</button>
            </div>
            {entry.itemId && (
              <div className="flex gap-1 ml-1">
                <button onClick={() => update(entry.id, 'source', 'rental')}
                  className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                  Rental
                </button>
                <button onClick={() => update(entry.id, 'source', 'dop_owned')}
                  className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                  DOP owned
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add {title.toLowerCase()} item</button>
    </div>
  )
}

export default function CameraPageEditor({ params }: { params: Promise<{ id: string, cameraId: string }> }) {
  const supabase = supabaseClient
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
  const [powerEntries, setPowerEntries] = useState<PowerEntry[]>([])
  const [headTripodEntries, setHeadTripodEntries] = useState<SectionEntry[]>([{ id: '1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const [gripEntries, setGripEntries] = useState<SectionEntry[]>([{ id: '1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const [aksEntries, setAksEntries] = useState<any[]>([{ id: '1', category: '', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const [filtEntries, setFiltEntries] = useState<SectionEntry[]>([{ id: '1', itemId: '', itemName: '', source: 'rental', quantity: 1 }])

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
      if (power.length > 0) setPowerEntries(power.map((i: any) => ({
        type: i.equipment_items?.subcategory === 'block' ? 'block' : i.equipment_items?.subcategory === 'acdc' ? 'acdc' : 'onboard',
        itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '',
        quantity: i.quantity || 1, source: i.source || 'rental'
      })))
      const ht = items.filter((i: any) => i.section === 'head_tripod')
      if (ht.length > 0) setHeadTripodEntries(ht.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
      const grip = items.filter((i: any) => i.section === 'grip')
      if (grip.length > 0) setGripEntries(grip.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
      const aks = items.filter((i: any) => i.section === 'aks')
      if (aks.length > 0) setAksEntries(aks.map((i: any) => ({ id: i.id, category: i.equipment_items?.subcategory || '', itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
      const filt = items.filter((i: any) => i.section === 'filtration')
      if (filt.length > 0) setFiltEntries(filt.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: 1, source: i.source || 'rental' })))
    }
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('camera_pages').update({
      camera_body_id: selectedBody && !selectedBody.startsWith('custom:') ? selectedBody : null,
      camera_body_source: bodySource, camera_notes: cameraNotes, camera_format: cameraFormat
    }).eq('id', cameraId)
    await supabase.from('camera_page_items').delete().eq('page_id', cameraId)
    const rows: any[] = []
    powerEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'power', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity || 1, source: e.source }))
    headTripodEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'head_tripod', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity || 1, source: e.source }))
    gripEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'grip', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity || 1, source: e.source }))
    aksEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'aks', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: e.quantity || 1, source: e.source }))
    filtEntries.filter(e => e.itemId).forEach(e => rows.push({ page_id: cameraId, section: 'filtration', item_id: e.itemId.startsWith('custom:') ? null : e.itemId, custom_label: e.itemId.startsWith('custom:') ? e.itemName : null, quantity: 1, source: e.source }))
    if (rows.length > 0) await supabase.from('camera_page_items').insert(rows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const bodies = allItems.filter(i => i.category === 'body')
  const onboardItems = allItems.filter(i => i.category === 'power' && i.subcategory === 'onboard')
  const blockItems = allItems.filter(i => i.category === 'power' && i.subcategory === 'block')
  const acdcItems = allItems.filter(i => i.category === 'power' && i.subcategory === 'acdc')
  const headTripodItems = allItems.filter(i => i.category === 'head_tripod')
  const gripItems = allItems.filter(i => i.category === 'grip')
  const filtrationItems = allItems.filter(i => i.category === 'filtration')
  const aksCategories = [...new Set(allItems.filter(i => i.category === 'aks').map(i => i.subcategory || 'Other'))]

  const addPowerEntry = (type: 'onboard' | 'block' | 'acdc') => {
    setPowerEntries(prev => [...prev, { type, itemId: '', itemName: '', quantity: 0, source: 'rental' }])
  }
  const updatePower = (idx: number, field: string, value: any) => setPowerEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  const removePower = (idx: number) => setPowerEntries(prev => prev.filter((_, i) => i !== idx))
  const updateAks = (idx: number, field: string, value: any) => setAksEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  const removeAks = (idx: number) => setAksEntries(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h2 className="text-2xl font-bold">{cameraLabel}</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Camera body</h3>
            <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
              <button onClick={() => setCameraFormat('digital')} className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cameraFormat === 'digital' ? 'bg-orange-400 text-black' : 'text-zinc-400 hover:text-white')}>Digital</button>
              <button onClick={() => setCameraFormat('film')} className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cameraFormat === 'film' ? 'bg-orange-400 text-black' : 'text-zinc-400 hover:text-white')}>Film</button>
            </div>
          </div>
          <SearchablePicker items={bodies} value={selectedBody} onChange={id => setSelectedBody(id)} placeholder="Search camera bodies..." />
          {selectedBody && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setBodySource('rental')} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (bodySource === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>Rental house</button>
              <button onClick={() => setBodySource('dop_owned')} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (bodySource === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>DOP owned</button>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Power</h3>
          <div className="space-y-3">
            {powerEntries.map((entry, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex gap-1 mb-2">
                      <span className={"text-xs px-2 py-0.5 rounded-full " + (entry.type === 'onboard' ? 'bg-blue-900 text-blue-400' : entry.type === 'acdc' ? 'bg-purple-900 text-purple-400' : 'bg-amber-900 text-amber-400')}>{entry.type === 'acdc' ? 'AC/DC' : entry.type}</span>
                    </div>
                    <SearchablePicker
                      items={entry.type === 'onboard' ? onboardItems : entry.type === 'acdc' ? acdcItems : blockItems}
                      value={entry.itemId}
                      onChange={(id, name) => { updatePower(idx, 'itemId', id); updatePower(idx, 'itemName', name) }}
                      placeholder={entry.type === 'onboard' ? 'Select battery type...' : entry.type === 'acdc' ? 'Select AC/DC...' : 'Select block battery...'}
                    />
                  </div>
                  <div className="w-16">
                    <input type="number" min="1" placeholder=""
                      value={entry.quantity === 0 ? '' : entry.quantity}
                      onChange={e => updatePower(idx, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <button onClick={() => removePower(idx)} className="text-zinc-600 hover:text-red-400 text-lg pb-1">×</button>
                </div>
                {entry.itemId && (
                  <div className="flex gap-1 ml-1">
                    <button onClick={() => updatePower(idx, 'source', 'rental')} className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>Rental</button>
                    <button onClick={() => updatePower(idx, 'source', 'dop_owned')} className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>DOP owned</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => addPowerEntry('onboard')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Onboard</button>
            <button onClick={() => addPowerEntry('block')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Block</button>
            <button onClick={() => addPowerEntry('acdc')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ AC/DC</button>
          </div>
        </div>

        <SectionList title="Head & Tripod" items={headTripodItems} entries={headTripodEntries} setEntries={setHeadTripodEntries} />
        <SectionList title="Grip" items={gripItems} entries={gripEntries} setEntries={setGripEntries} />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">AKS</h3>
          <div className="space-y-4">
            {aksEntries.map((entry, idx) => (
              <div key={entry.id} className="border border-zinc-800 rounded-xl p-4 relative">
                <button onClick={() => removeAks(idx)} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 text-lg">×</button>
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
                    <input type="number" min="1" placeholder=""
                      value={entry.quantity === 0 ? '' : entry.quantity}
                      onChange={e => updateAks(idx, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
                {entry.category && (
                  <div className="mb-3">
                    <label className="text-zinc-600 text-xs mb-1 block">Item</label>
                    <SearchablePicker
                      items={allItems.filter(i => i.category === 'aks' && i.subcategory === entry.category)}
                      value={entry.itemId}
                      onChange={(id, name) => { updateAks(idx, 'itemId', id); updateAks(idx, 'itemName', name) }}
                      placeholder={"Search " + entry.category + "..."}
                    />
                  </div>
                )}
                {entry.itemId && (
                  <div className="flex gap-1">
                    <button onClick={() => updateAks(idx, 'source', 'rental')} className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>Rental</button>
                    <button onClick={() => updateAks(idx, 'source', 'dop_owned')} className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>DOP owned</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setAksEntries(prev => [...prev, { id: Date.now().toString(), category: '', itemId: '', itemName: '', quantity: 0, source: 'rental' }])} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">+ Add AKS item</button>
        </div>

        <SectionList title="Filtration" items={filtrationItems} entries={filtEntries} setEntries={setFiltEntries} />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Camera notes</h3>
          <textarea value={cameraNotes} onChange={e => setCameraNotes(e.target.value)}
            placeholder="e.g. Steadicam, Ronin, handheld, operator notes..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none" />
        </div>
      </main>
    </div>
  )
}
