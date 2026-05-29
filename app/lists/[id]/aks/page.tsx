'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string; notes: string | null }
interface Entry { id: string; topCategory: string; itemId: string; itemName: string; quantity: number; source: string; notes: string }

const TOP_CATEGORIES = [
  'Camera Plates',
  'Onboard Monitors',
  'Mattebox',
  'Lens Control',
  "Director's Viewfinder",
  'Rangefinder',
  'Misc',
]

const SUBCATEGORY_TO_TOP: Record<string, string> = {
  'Alexa 35': 'Camera Plates',
  'Mini LF': 'Camera Plates',
  'Handheld Handles': 'Camera Plates',
  'Camera Handles': 'Camera Plates',
  'Onboard Monitors': 'Onboard Monitors',
  'Camera Control Monitor': 'Onboard Monitors',
  'Recording Onboard Monitor': 'Onboard Monitors',
  'Clamp-on': 'Mattebox',
  'Studio': 'Mattebox',
  'Manual': 'Lens Control',
  'Digital Control': 'Lens Control',
  'Wireless': 'Lens Control',
  'Digital': "Director's Viewfinder",
  'Analog': "Director's Viewfinder",
  'Rangefinder': 'Rangefinder',
  'Underwater': 'Misc',
  'Rain Deflectors': 'Misc',
  'Carts': 'Misc',
}

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={"w-full text-left bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors flex items-center justify-between " + (value ? "text-white" : "text-zinc-500")}
      >
        {value || "Select category..."}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-zinc-500"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          {TOP_CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => { onChange(cat); setOpen(false) }}
              className={"w-full text-left px-4 py-2.5 text-sm transition-colors " + (value === cat ? "bg-[#2a2000] text-[#FFE135]" : "text-zinc-200 hover:bg-zinc-800")}>
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemPicker({ items, topCategory, value, onChange }: {
  items: Item[]; topCategory: string; value: string; onChange: (id: string, name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)

  useEffect(() => { if (selected) setQuery(selected.name); else setQuery('') }, [value, selected])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter to top category, then filter by search query
  const categoryItems = items.filter(i => {
    if (i.category === 'misc' && topCategory === 'Misc') return true
    return SUBCATEGORY_TO_TOP[i.subcategory || ''] === topCategory
  })

  const filtered = categoryItems.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))

  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.subcategory || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  if (!topCategory) return null

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={"Search " + topCategory.toLowerCase() + "..."}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]"
      />
      {value && (
        <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>
      )}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-[#FFE135] hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom
            </button>
          ) : (
            <>
              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  {Object.keys(grouped).length > 1 && (
                    <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{group}</div>
                  )}
                  {groupItems.map(item => (
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

export default function AKSPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [qtyWarning, setQtyWarning] = useState(false)
  const [saved, setSaved] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const entriesRef = useRef<Entry[]>([])
  const listIdRef = useRef('')
  const userIdRef = useRef('')

  useEffect(() => { entriesRef.current = entries }, [entries])
  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').in('category', ['aks', 'misc']).order('subcategory').order('name'),
      supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', lid).eq('section', 'aks').order('sort_order')
    ])
    if (eq) setAllItems(eq)
    if (existing && existing.length > 0) {
      setEntries(existing.map((i: any) => {
        const subcat = i.equipment_items?.subcategory || ''
        const topCat = SUBCATEGORY_TO_TOP[subcat] || (i.equipment_items?.category === 'misc' ? 'Miscellaneous' : '')
        return { id: i.id, topCategory: topCat, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental', notes: i.notes || '' }
      }))
    } else {
      setEntries([{ id: '1', topCategory: '', itemId: '', itemName: '', quantity: 1, source: 'rental', notes: '' }])
    }
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    const ents = entriesRef.current
    const lid = listIdRef.current
    const uid = userIdRef.current
    const invalid = entries.filter(e => e.itemId && (e.quantity < 1 || !e.quantity))
    if (invalid.length > 0) {
      setQtyWarning(true)
      setTimeout(() => setQtyWarning(false), 3000)
      return
    }
    setQtyWarning(false)
    isSavingRef.current = true
    setSaving(true)
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'aks')
    const rows = ents.filter(e => e.itemId).map((e, i) => ({
      list_id: lid, owner_id: uid, section: 'aks',
      item_id: e.itemId.startsWith('custom:') ? null : e.itemId,
      custom_label: e.itemId.startsWith('custom:') ? e.itemName : null,
      quantity: e.quantity || 1, source: e.source, notes: e.notes, sort_order: i
    }))
    if (rows.length > 0) await supabase.from('list_items').insert(rows)
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const update = (id: string, field: string, value: any) => setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  const remove = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const add = () => setEntries(prev => [...prev, { id: Date.now().toString(), topCategory: '', itemId: '', itemName: '', quantity: 1, source: 'rental', notes: '' }])

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          {qtyWarning && <span className="text-red-400 text-sm">Please enter qty for all items</span>}
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">AKS</h2>
        <p className="text-zinc-500 text-sm mb-6">Camera accessories, wireless systems, monitors and other kit</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {entries.map(entry => (
            <div key={entry.id} className="space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <CategoryPicker value={entry.topCategory} onChange={v => { update(entry.id, 'topCategory', v); update(entry.id, 'itemId', ''); update(entry.id, 'itemName', '') }} />
                  {entry.topCategory && (
                    <ItemPicker items={allItems} topCategory={entry.topCategory} value={entry.itemId}
                      onChange={(id, name) => { update(entry.id, 'itemId', id); update(entry.id, 'itemName', name); if (id) triggerAutoSave(600) }} />
                  )}
                </div>
                <input type="number" min="1" placeholder="Qty"
                  value={entry.quantity === 0 ? '' : entry.quantity}
                  onChange={e => update(entry.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-16 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#FFE135] mt-0" />
                <button onClick={() => remove(entry.id)} className="text-zinc-600 hover:text-red-400 text-lg mt-2.5">×</button>
              </div>
              {entry.itemId && (
                <div className="ml-1 space-y-1.5">
                  <div className="flex gap-1">
                    {['rental', 'dop_owned', 'ac_owned'].map(s => (
                      <button key={s} onClick={() => { update(entry.id, 'source', s); triggerAutoSave(300) }}
                        className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                        {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                      </button>
                    ))}
                  </div>
                  {(() => { const item = allItems.find(i => i.id === entry.itemId); return item?.notes ? <p className="text-xs text-amber-500/80 px-1">{item.notes}</p> : null })()}
                  <input type="text" value={entry.notes} onChange={e => update(entry.id, 'notes', e.target.value)}
                    placeholder="Notes (optional)..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FFE135]" />
                </div>
              )}
            </div>
          ))}
          <button onClick={add} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
            + Add AKS item
          </button>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/filtration"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
              ← Filtration
            </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listId + "/head-tripod"; }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
              Head & Legs →
            </button>
        </div>
      </main>
    </div>
  )
}
