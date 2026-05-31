'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

const supabaseClient = createClient()

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }

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
          className={"w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] " + (value ? "pr-12" : "")} />
        {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3 text-zinc-400 hover:text-white text-base leading-none">×</button>}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-[#FFE135] hover:bg-zinc-800"
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
                <button className="w-full text-left px-4 py-3 text-sm text-[#FFE135] hover:bg-zinc-800 border-t border-zinc-800"
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
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const selectedBodyRef = useRef('')
  const bodySourceRef = useRef('rental')
  const cameraNotesRef = useRef('')
  const cameraIdRef = useRef('')
  const cameraFormatRef = useRef('digital')

  useEffect(() => { selectedBodyRef.current = selectedBody }, [selectedBody])
  useEffect(() => { bodySourceRef.current = bodySource }, [bodySource])
  useEffect(() => { cameraNotesRef.current = cameraNotes }, [cameraNotes])
  useEffect(() => { cameraIdRef.current = cameraId }, [cameraId])
  useEffect(() => { cameraFormatRef.current = cameraFormat }, [cameraFormat])

  useEffect(() => {
    params.then(p => { setListId(p.id); setCameraId(p.cameraId); loadData(p.id, p.cameraId) })
  }, [])

  const loadData = async (lid: string, cid: string) => {
    const [{ data: cam }, { data: eq }] = await Promise.all([
      supabase.from('camera_pages').select('*').eq('id', cid).single(),
      supabase.from('equipment_items').select('*').eq('category', 'body').order('name')
    ])
    if (cam) {
      setCameraLabel(cam.label)
      setCameraFormat(cam.camera_format || 'digital')
      if (cam.camera_body_id) setSelectedBody(cam.camera_body_id)
      if (cam.camera_body_source) setBodySource(cam.camera_body_source)
      if (cam.camera_notes) setCameraNotes(cam.camera_notes)
    }
    if (eq) setAllItems(eq)
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setSaving(true)
    const body = selectedBodyRef.current
    const source = bodySourceRef.current
    const notes = cameraNotesRef.current
    const cid = cameraIdRef.current
    const fmt = cameraFormatRef.current
    await supabase.from('camera_pages').update({
      camera_body_id: body && !body.startsWith('custom:') ? body : null,
      camera_body_source: source,
      camera_notes: notes,
      camera_format: fmt
    }).eq('id', cid)
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const digitalBodies = allItems.filter(i => !i.subcategory || i.subcategory === 'digital')
  const filmBodies = allItems.filter(i => i.subcategory === 'film')
  const bodies = cameraFormat === 'film' ? filmBodies : digitalBodies

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
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
              <button onClick={() => { setCameraFormat('digital'); triggerAutoSave(600) }} className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cameraFormat === 'digital' ? 'bg-[#FFE135] text-black' : 'text-zinc-400 hover:text-white')}>Digital</button>
              <button onClick={() => { setCameraFormat('film'); triggerAutoSave(600) }} className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cameraFormat === 'film' ? 'bg-[#FFE135] text-black' : 'text-zinc-400 hover:text-white')}>Film</button>
            </div>
          </div>
          <SearchablePicker items={bodies} value={selectedBody} onChange={(id, name) => { setSelectedBody(id); if (id) triggerAutoSave(600) }} placeholder="Search camera bodies..." />
          {selectedBody && (
            <div className="flex gap-2 mt-3">
              {['rental', 'dop_owned', 'ac_owned'].map(s => (
                <button key={s} onClick={() => { setBodySource(s); triggerAutoSave(300) }}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (bodySource === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                  {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Camera notes</h3>
          <textarea value={cameraNotes} onChange={e => setCameraNotes(e.target.value)}
            placeholder="e.g. Steadicam, Ronin, handheld, operator notes..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>
      </main>
    </div>
  )
}
