'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }
interface CameraState {
  id: string
  label: string
  format: string
  bodyId: string
  bodySource: string
  notes: string
}

function SearchablePicker({ items, value, onChange, placeholder }: {
  items: Item[]; value: string; onChange: (id: string, name: string) => void; placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)
  useEffect(() => { if (selected) setQuery(selected.name); else setQuery('') }, [value, items])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  const filmOrder = ['65mm', '35mm', '16mm']
  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.brand || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const ai = filmOrder.indexOf(a); const bi = filmOrder.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1; if (bi === -1) return -1
    return ai - bi
  })
  return (
    <div ref={ref} className="relative">
      <input type="text" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
      {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-[#FFE135] hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom
            </button>
          ) : (
            <>
              {sortedGroupKeys.map(brand => { const brandItems = grouped[brand]; return (
                <div key={brand}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{brand}</div>
                  {brandItems.map(item => (
                    <button key={item.id} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
                      onClick={() => { onChange(item.id, item.name); setQuery(item.name); setOpen(false) }}>
                      {item.name}
                    </button>
                  ))}
                </div>
              )})}
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

export default function CameraPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [cameras, setCameras] = useState<CameraState[]>([])
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const camerasRef = useRef<CameraState[]>([])
  const listIdRef = useRef('')

  useEffect(() => { camerasRef.current = cameras }, [cameras])
  useEffect(() => { listIdRef.current = listId }, [listId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: cams }, { data: eq }] = await Promise.all([
      supabase.from('camera_pages').select('*').eq('list_id', lid).order('sort_order'),
      supabase.from('equipment_items').select('*').eq('category', 'body').order('name')
    ])
    if (eq) setAllItems(eq)
    if (cams) {
      setCameras(cams.map((c: any) => ({
        id: c.id,
        label: c.label,
        format: c.camera_format || 'digital',
        bodyId: c.camera_body_id || '',
        bodySource: c.camera_body_source || 'rental',
        notes: c.camera_notes || ''
      })))
    }
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setSaving(true)
    const cams = camerasRef.current
    await Promise.all(cams.map(cam =>
      supabase.from('camera_pages').update({
        camera_body_id: cam.bodyId && !cam.bodyId.startsWith('custom:') ? cam.bodyId : null,
        camera_body_source: cam.bodySource,
        camera_notes: cam.notes,
        camera_format: cam.format
      }).eq('id', cam.id)
    ))
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updateCamera = (id: string, field: keyof CameraState, value: string) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Camera Body</h2>
        <div className="space-y-4">
          {cameras.map(cam => {
            const digitalBodies = allItems.filter(i => !i.subcategory || i.subcategory === 'digital')
            const filmBodies = allItems.filter(i => i.subcategory === 'film')
            const bodies = cam.format === 'film' ? filmBodies : digitalBodies
            return (
              <div key={cam.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">{cam.label}</h3>
                  <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                    <button onClick={() => { updateCamera(cam.id, 'format', 'digital'); triggerAutoSave(600) }}
                      className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cam.format === 'digital' ? 'bg-[#FFE135] text-black' : 'text-zinc-400 hover:text-white')}>Digital</button>
                    <button onClick={() => { updateCamera(cam.id, 'format', 'film'); triggerAutoSave(600) }}
                      className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (cam.format === 'film' ? 'bg-[#FFE135] text-black' : 'text-zinc-400 hover:text-white')}>Film</button>
                  </div>
                </div>
                <SearchablePicker items={bodies} value={cam.bodyId}
                  onChange={(id, name) => { updateCamera(cam.id, 'bodyId', id); if (id) triggerAutoSave(600) }}
                  placeholder={"Search camera bodies for " + cam.label + "..."} />
                {cam.bodyId && (
                  <div className="flex gap-2 mt-3">
                    {['rental', 'dop_owned', 'ac_owned'].map(s => (
                      <button key={s} onClick={() => { updateCamera(cam.id, 'bodySource', s); triggerAutoSave(300) }}
                        className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (cam.bodySource === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                        {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Camera notes</h4>
                  <textarea value={cam.notes} onChange={e => { updateCamera(cam.id, 'notes', e.target.value); triggerAutoSave(1000) }}
                    placeholder="e.g. Steadicam, Ronin, handheld, operator notes..."
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Back to list
          </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listIdRef.current + "/power" }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
            Power →
          </button>
        </div>
      </main>
    </div>
  )
}
