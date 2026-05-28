'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }
interface Entry { id: string; itemId: string; itemName: string; quantity: number; source: string }

function SearchablePicker({ items, value, onChange, placeholder }: {
  items: Item[]; value: string; onChange: (id: string, name: string) => void; placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)
  useEffect(() => { if (selected) setQuery(selected.name) }, [value])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  const subOrder = ['150mm', '100mm', '70mm', 'Geared Head', 'Specialty']
  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.subcategory || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const ai = subOrder.indexOf(a); const bi = subOrder.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
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
              {sortedGroupKeys.map(group => { const groupItems = grouped[group]; return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{group}</div>
                  {groupItems.map(item => (
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

export default function HeadTripodPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [sectionNotes, setSectionNotes] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const entriesRef = useRef<Entry[]>([])
  const listIdRef = useRef('')
  const userIdRef = useRef('')
  const notesRef = useRef('')
  const notesIdRef = useRef<string | null>(null)

  useEffect(() => { entriesRef.current = entries }, [entries])
  useEffect(() => { notesRef.current = sectionNotes }, [sectionNotes])
  useEffect(() => { notesIdRef.current = notesId }, [notesId])
  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    listIdRef.current = lid
    const [{ data: eq }, { data: existing }, { data: notesData }] = await Promise.all([
      supabase.from('equipment_items').select('*').eq('category', 'head_tripod').order('subcategory').order('name'),
      supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', lid).eq('section', 'head_tripod').order('sort_order'),
      supabase.from('list_section_notes').select('*').eq('list_id', lid).eq('section', 'head_tripod').maybeSingle()
    ])
    if (eq) setAllItems(eq)
    if (notesData) { setSectionNotes(notesData.notes || ''); setNotesId(notesData.id) }
    if (existing && existing.length > 0) {
      setEntries(existing.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity ?? 0, source: i.source || 'rental' })))
    } else {
      setEntries([{ id: '1', itemId: '', itemName: '', quantity: 0, source: 'rental' }])
    }
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    const ents = entriesRef.current
    const lid = listIdRef.current
    const uid = userIdRef.current
    const notes = notesRef.current
    const nid = notesIdRef.current
    setSaving(true)
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'head_tripod')
    const rows = ents.filter(e => e.itemId).map((e, i) => ({
      list_id: lid, owner_id: uid, section: 'head_tripod',
      item_id: e.itemId.startsWith('custom:') ? null : e.itemId,
      custom_label: e.itemId.startsWith('custom:') ? e.itemName : null,
      quantity: e.quantity || 1, source: e.source, sort_order: i
    }))
    if (rows.length > 0) await supabase.from('list_items').insert(rows)
    if (nid) {
      await supabase.from('list_section_notes').update({ notes }).eq('id', nid)
    } else if (notes.trim()) {
      const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, owner_id: uid, section: 'head_tripod', notes }).select().single()
      if (newNote) setNotesId(newNote.id)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const update = (id: string, field: string, value: any) => setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  const remove = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const add = () => setEntries(prev => [...prev, { id: Date.now().toString(), itemId: '', itemName: '', quantity: 0, source: 'rental' }])

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={'/lists/' + listId} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Head & Legs</h2>
        <p className="text-zinc-500 text-sm mb-6">Camera heads, tripods and support systems</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          {entries.map(entry => (
            <div key={entry.id}>
              <div className="flex gap-2 items-center min-w-0">
                <div className="flex-1">
                  <SearchablePicker items={allItems} value={entry.itemId}
                    onChange={(id, name) => { update(entry.id, 'itemId', id); update(entry.id, 'itemName', name); if (id) triggerAutoSave(600) }}
                    placeholder="Search heads & legs..." />
                </div>
                <input type="number" min="1" placeholder="Qty"
                  value={entry.quantity === 0 ? '' : entry.quantity}
                  onChange={e => { update(entry.id, 'quantity', parseInt(e.target.value) || 0); triggerAutoSave(1000) }}
                  className="w-12 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-3 text-sm focus:outline-none focus:border-[#FFE135] text-center" />
                <button onClick={() => remove(entry.id)} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
              </div>
              {entry.itemId && (
                <div className="mt-1.5 ml-1 space-y-1.5">
                  <div className="flex gap-1">
                    {['rental', 'dop_owned', 'ac_owned'].map(s => (
                      <button key={s} onClick={() => { update(entry.id, 'source', s); triggerAutoSave(300) }}
                        className={" px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                        {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={add} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
            + Add head & legs
          </button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Section notes</h3>
          <textarea value={sectionNotes} onChange={e => setSectionNotes(e.target.value)}
            placeholder="Any notes... (Specify Moy or Bowl, if required)"
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>
      </main>
    </div>
  )
}
