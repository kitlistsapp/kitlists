'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string; notes: string | null }
interface Entry { id: string; itemId: string; itemName: string; quantity: number; source: string; notes: string }

const SECTION_SUBCATS: Record<string, string[]> = {
  'Camera Plates': ['Alexa 35', 'Mini LF', 'Handheld Handles', 'Camera Handles'],
  'Onboard Monitors': ['Onboard Monitors', 'Camera Control Monitor', 'Recording Onboard Monitor'],
  'Mattebox': ['Clamp-on', 'Studio'],
  'Lens Control': ['Manual', 'Digital Control', 'Wireless'],
  "Director's Viewfinder": ['Digital', 'Analog'],
  'Rangefinder': ['Rangefinder'],
  'Misc': [],
}

function SearchablePicker({ items, value, onChange, placeholder }: {
  items: Item[]; value: string; onChange: (id: string, name: string) => void; placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)
  useEffect(() => { if (selected) setQuery(selected.name); else setQuery('') }, [value])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.subcategory || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  return (
    <div ref={ref} className="relative">
      <input type="text" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={"w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] " + (value ? "pr-12" : "")} />
      {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3 text-zinc-400 hover:text-white text-base leading-none">×</button>}
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
                    <button key={item.id} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
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
  const [saved, setSaved] = useState(false)
  const [qtyWarning, setQtyWarning] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [sectionEntries, setSectionEntries] = useState<Record<string, Entry[]>>({
    'Camera Plates': [],
    'Onboard Monitors': [],
    'Mattebox': [],
    'Lens Control': [],
    "Director's Viewfinder": [],
    'Rangefinder': [],
    'Misc': [],
  })
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const sectionEntriesRef = useRef<Record<string, Entry[]>>({})
  const listIdRef = useRef('')
  const userIdRef = useRef('')

  useEffect(() => { sectionEntriesRef.current = sectionEntries }, [sectionEntries])
  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const getSectionForItem = (item: any): string => {
    const subcat = item.equipment_items?.subcategory || ''
    const cat = item.equipment_items?.category || ''
    for (const [section, subcats] of Object.entries(SECTION_SUBCATS)) {
      if (section === 'Misc' && cat === 'misc') return 'Misc'
      if (subcats.includes(subcat)) return section
    }
    return 'Misc'
  }

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setUserId(user.id); userIdRef.current = user.id }
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').in('category', ['aks', 'misc']).order('subcategory').order('name'),
      supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', lid).eq('section', 'aks').order('sort_order')
    ])
    if (eq) setAllItems(eq)
    if (existing && existing.length > 0) {
      const newSections: Record<string, Entry[]> = {}
      for (const sec of Object.keys(SECTION_SUBCATS)) newSections[sec] = []
      for (const i of existing) {
        const sec = getSectionForItem(i)
        if (!newSections[sec]) newSections[sec] = []
        newSections[sec].push({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental', notes: i.notes || '' })
      }
      for (const sec of Object.keys(SECTION_SUBCATS)) {
        if (!newSections[sec]) newSections[sec] = []
      }
      setSectionEntries(newSections)
    }
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    const sections = sectionEntriesRef.current
    const lid = listIdRef.current
    const uid = userIdRef.current
    const allEntries = Object.values(sections).flat()
    const invalid = allEntries.filter(e => e.itemId && (e.quantity < 1 || !e.quantity))
    if (invalid.length > 0) { setQtyWarning(true); setTimeout(() => setQtyWarning(false), 3000); return }
    setQtyWarning(false)
    isSavingRef.current = true
    setSaving(true)
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'aks')
    const rows: any[] = []
    let offset = 0
    for (const entries of Object.values(sections)) {
      entries.filter(e => e.itemId).forEach((e, i) => rows.push({
        list_id: lid, owner_id: uid, section: 'aks',
        item_id: e.itemId.startsWith('custom:') ? null : e.itemId,
        custom_label: e.itemId.startsWith('custom:') ? e.itemName : null,
        quantity: e.quantity || 1, source: e.source, notes: e.notes, sort_order: offset + i
      }))
      offset += 100
    }
    if (rows.length > 0) await supabase.from('list_items').insert(rows)
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updateEntry = (section: string, id: string, field: string, value: any) => {
    setSectionEntries(prev => ({
      ...prev,
      [section]: prev[section].map(e => e.id === id ? { ...e, [field]: value } : e)
    }))
  }
  const removeEntry = (section: string, id: string) => {
    setSectionEntries(prev => ({
      ...prev,
      [section]: prev[section].filter(e => e.id !== id)
    }))
  }
  const addEntry = (section: string) => {
    setSectionEntries(prev => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, source: 'rental', notes: '' }]
    }))
  }

  const renderSection = (section: string) => {
    const subcats = SECTION_SUBCATS[section]
    const items = section === 'Misc'
      ? allItems.filter(i => i.category === 'misc')
      : allItems.filter(i => subcats.includes(i.subcategory || ''))
    const entries = sectionEntries[section] || []

    return (
      <div key={section} className="mb-6">
        <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{section}</h4>
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id}>
              <div className="flex gap-2 items-center min-w-0">
                <div className="flex-1">
                  <SearchablePicker items={items} value={entry.itemId}
                    onChange={(id, name) => { updateEntry(section, entry.id, 'itemId', id); updateEntry(section, entry.id, 'itemName', name); if (id) triggerAutoSave(600) }}
                    placeholder={"Search " + section.toLowerCase() + "..."} />
                </div>
                {entry.itemId && (
                  <input type="number" min="1"
                    value={entry.quantity === 0 ? '' : entry.quantity}
                    onChange={e => { updateEntry(section, entry.id, 'quantity', parseInt(e.target.value) || 0); triggerAutoSave(1000) }}
                    className="w-12 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-3 text-sm focus:outline-none focus:border-[#FFE135] text-center" />
                )}
                <button onClick={() => removeEntry(section, entry.id)} className={"text-lg " + (entry.itemId ? "text-zinc-600 hover:text-red-400" : "text-zinc-700 hover:text-zinc-400")}>×</button>
              </div>
              {entry.itemId && (
                <div className="ml-1 mt-1.5 space-y-1.5">
                  <div className="flex gap-1">
                    {['rental', 'dop_owned', 'ac_owned'].map(s => (
                      <button key={s} onClick={() => { updateEntry(section, entry.id, 'source', s); triggerAutoSave(300) }}
                        className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                        {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                      </button>
                    ))}
                  </div>
                  {(() => { const item = allItems.find(i => i.id === entry.itemId); return item?.notes ? <p className="text-xs text-amber-500/80 px-1">{item.notes}</p> : null })()}
                  <input type="text" value={entry.notes} onChange={e => { updateEntry(section, entry.id, 'notes', e.target.value); triggerAutoSave(1000) }}
                    placeholder="Notes (optional)..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FFE135]" />
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => addEntry(section)}
          className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
          + Add {section.toLowerCase()} item
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {Object.keys(SECTION_SUBCATS).map(section => renderSection(section))}
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/filtration"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Filtration
          </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listIdRef.current + "/head-tripod" }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
            Head & Legs →
          </button>
        </div>
      </main>
    </div>
  )
}
