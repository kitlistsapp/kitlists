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

  useEffect(() => {
    if (selected) setQuery(selected.name)
  }, [value, items])

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
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
      />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button
              className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 transition-colors"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}
            >
              + Add "{query}" as custom item
            </button>
          ) : (
            <>
              {Object.entries(grouped).map(([brand, brandItems]) => (
                <div key={brand}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{brand}</div>
                  {brandItems.map(item => (
                    <button
                      key={item.id}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
                      onClick={() => { onChange(item.id, item.name); setQuery(item.name); setOpen(false) }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ))}
              {query && !filtered.find(i => i.name.toLowerCase() === query.toLowerCase()) && (
                <button
                  className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 border-t border-zinc-800 transition-colors"
                  onClick={() => { onChange('custom:' + query, query); setOpen(false) }}
                >
                  + Add "{query}" as custom item
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ChecklistSection({ title, items, selected, onToggle }: {
  title: string
  items: Item[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const grouped = items.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.subcategory || item.brand || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="mb-8">
      <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">{title}</h3>
      {Object.entries(grouped).map(([group, groupItems]) => (
        <div key={group} className="mb-4">
          {Object.keys(grouped).length > 1 && (
            <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2">{group}</div>
          )}
          <div className="space-y-1">
            {groupItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${ selected.includes(item.id) ? 'bg-orange-400 border-orange-400' : 'border-zinc-600 group-hover:border-zinc-400' }`}
                  onClick={() => onToggle(item.id)}
                >
                  {selected.includes(item.id) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div onClick={() => onToggle(item.id)} className="flex-1">
                  <span className="text-sm text-zinc-200">{item.name}</span>
                  {item.brand && <span className="text-xs text-zinc-600 ml-2">{item.brand}</span>}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CameraPageEditor({ params }: { params: Promise<{ id: string, cameraId: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [cameraLabel, setCameraLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedBody, setSelectedBody] = useState('')
  const [bodySource, setBodySource] = useState('rental')
  const [selectedPower, setSelectedPower] = useState<string[]>([])
  const [selectedAks, setSelectedAks] = useState<string[]>([])
  const [selectedGrip, setSelectedGrip] = useState<string[]>([])
  const [selectedFiltration, setSelectedFiltration] = useState<string[]>([])
  const [cameraNotes, setCameraNotes] = useState('')

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
      if (cam.camera_body_id) setSelectedBody(cam.camera_body_id)
      if (cam.camera_body_source) setBodySource(cam.camera_body_source)
      if (cam.camera_notes) setCameraNotes(cam.camera_notes)
    }
    if (eq) setAllItems(eq)
    const { data: items } = await supabase.from('camera_page_items').select('*').eq('page_id', cid)
    if (items) {
      setSelectedPower(items.filter((i: any) => i.section === 'power').map((i: any) => i.item_id))
      setSelectedAks(items.filter((i: any) => i.section === 'aks').map((i: any) => i.item_id))
      setSelectedGrip(items.filter((i: any) => i.section === 'grip').map((i: any) => i.item_id))
      setSelectedFiltration(items.filter((i: any) => i.section === 'filtration').map((i: any) => i.item_id))
    }
  }

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('camera_pages').update({
      camera_body_id: selectedBody && !selectedBody.startsWith('custom:') ? selectedBody : null,
      camera_body_source: bodySource,
      camera_notes: cameraNotes
    }).eq('id', cameraId)
    await supabase.from('camera_page_items').delete().eq('page_id', cameraId)
    const sectionItems = [
      ...selectedPower.map(id => ({ page_id: cameraId, section: 'power', item_id: id.startsWith('custom:') ? null : id, custom_label: id.startsWith('custom:') ? id.slice(7) : null, source: 'rental' })),
      ...selectedAks.map(id => ({ page_id: cameraId, section: 'aks', item_id: id.startsWith('custom:') ? null : id, custom_label: id.startsWith('custom:') ? id.slice(7) : null, source: 'rental' })),
      ...selectedGrip.map(id => ({ page_id: cameraId, section: 'grip', item_id: id.startsWith('custom:') ? null : id, custom_label: id.startsWith('custom:') ? id.slice(7) : null, source: 'rental' })),
      ...selectedFiltration.map(id => ({ page_id: cameraId, section: 'filtration', item_id: id.startsWith('custom:') ? null : id, custom_label: id.startsWith('custom:') ? id.slice(7) : null, source: 'rental' }))
    ]
    if (sectionItems.length > 0) await supabase.from('camera_page_items').insert(sectionItems)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const bodies = allItems.filter(i => i.category === 'body')
  const power = allItems.filter(i => i.category === 'power')
  const aks = allItems.filter(i => i.category === 'aks')
  const grip = allItems.filter(i => i.category === 'grip')
  const filtration = allItems.filter(i => i.category === 'filtration')

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">{cameraLabel}</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

          <div className="mb-8">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Camera body</h3>
            <SearchablePicker
              items={bodies}
              value={selectedBody}
              onChange={(id) => setSelectedBody(id)}
              placeholder="Search camera bodies..."
            />
            {selectedBody && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setBodySource('rental')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ bodySource === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>Rental house</button>
                <button onClick={() => setBodySource('dop_owned')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ bodySource === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>DOP owned</button>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 my-6" />
          <ChecklistSection title="Power" items={power} selected={selectedPower} onToggle={id => toggle(id, selectedPower, setSelectedPower)} />
          <div className="border-t border-zinc-800 my-6" />
          <ChecklistSection title="AKS" items={aks} selected={selectedAks} onToggle={id => toggle(id, selectedAks, setSelectedAks)} />
          <div className="border-t border-zinc-800 my-6" />
          <ChecklistSection title="Grip" items={grip} selected={selectedGrip} onToggle={id => toggle(id, selectedGrip, setSelectedGrip)} />
          <div className="border-t border-zinc-800 my-6" />
          <ChecklistSection title="Filtration" items={filtration} selected={selectedFiltration} onToggle={id => toggle(id, selectedFiltration, setSelectedFiltration)} />
          <div className="border-t border-zinc-800 my-6" />

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Camera notes</h3>
            <textarea
              value={cameraNotes}
              onChange={e => setCameraNotes(e.target.value)}
              placeholder="e.g. Steadicam, Ronin, handheld, operator notes..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  )
}