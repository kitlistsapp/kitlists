'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }
interface Entry { id: string; itemId: string; itemName: string; quantity: number; source: string }

const PSR_SUBCAT_ORDER = ['NEUTRAL DENSITY', 'VARIABLE ND', 'POLA', 'OPTICAL FLAT', 'DIOPTERS', 'SPLIT DIOPTERS', 'GRADS', 'DIFFUSION', 'FX']

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
  // Group by subcategory preserving PSR_SUBCAT_ORDER
  const grouped: Record<string, Item[]> = {}
  for (const item of filtered) {
    const key = item.subcategory || 'Other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const ai = PSR_SUBCAT_ORDER.indexOf(a)
    const bi = PSR_SUBCAT_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return 0
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
          {filtered.length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-[#FFE135] hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom
            </button>
          ) : (
            <>
              {sortedKeys.map(group => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{group}</div>
                  {grouped[group].map(item => (
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

export default function FiltrationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [qtyWarning, setQtyWarning] = useState(false)
  const [psrItems, setPsrItems] = useState<Item[]>([])
  const [sixItems, setSixItems] = useState<Item[]>([])
  const [psrEntries, setPsrEntries] = useState<Entry[]>([{ id: 'psr1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const [sixEntries, setSixEntries] = useState<Entry[]>([{ id: 'six1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
  const [sectionNotes, setSectionNotes] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const psrRef = useRef<Entry[]>([])
  const sixRef = useRef<Entry[]>([])
  const listIdRef = useRef('')
  const userIdRef = useRef('')
  const notesRef = useRef('')
  const notesIdRef = useRef<string | null>(null)

  useEffect(() => { psrRef.current = psrEntries }, [psrEntries])
  useEffect(() => { sixRef.current = sixEntries }, [sixEntries])
  useEffect(() => { notesRef.current = sectionNotes }, [sectionNotes])
  useEffect(() => { notesIdRef.current = notesId }, [notesId])
  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setUserId(user.id); userIdRef.current = user.id }
    const [{ data: psr }, { data: six }, { data: existing }, { data: notesData }] = await Promise.all([
      supabase.from('equipment_items').select('*').eq('category', 'filtration_psr'),
      supabase.from('equipment_items').select('*').eq('category', 'filtration_6x6'),
      supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', lid).eq('section', 'filtration').order('sort_order'),
      supabase.from('list_section_notes').select('*').eq('list_id', lid).eq('section', 'filtration').maybeSingle()
    ])
    if (psr) setPsrItems(psr)
    if (six) setSixItems(six)
    if (notesData) { setSectionNotes(notesData.notes || ''); setNotesId(notesData.id); notesIdRef.current = notesData.id }
    if (existing && existing.length > 0) {
      const psrCats = ['filtration_psr']
      const sixCats = ['filtration_6x6']
      const toEntry = (i: any): Entry => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity ?? 1, source: i.source || 'rental' })
      const psrRows = existing.filter((i: any) => psrCats.includes(i.equipment_items?.category)).map(toEntry)
      const sixRows = existing.filter((i: any) => sixCats.includes(i.equipment_items?.category)).map(toEntry)
      setPsrEntries(psrRows.length > 0 ? psrRows : [{ id: 'psr1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
      setSixEntries(sixRows.length > 0 ? sixRows : [{ id: 'six1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
    }
  }

  const triggerAutoSave = (delay = 600) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    const psr = psrRef.current
    const six = sixRef.current
    const lid = listIdRef.current
    const uid = userIdRef.current
    const notes = notesRef.current
    const nid = notesIdRef.current
    const allEntries = [...psr, ...six]
    const invalid = allEntries.filter(e => e.itemId && (e.quantity < 1 || !e.quantity))
    if (invalid.length > 0) { setQtyWarning(true); setTimeout(() => setQtyWarning(false), 3000); return }
    setQtyWarning(false)
    isSavingRef.current = true
    setSaving(true)
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'filtration')
    const rows: any[] = []
    const addRows = (entries: Entry[], offset: number) => entries.filter(e => e.itemId).forEach((e, i) => rows.push({
      list_id: lid, owner_id: uid, section: 'filtration',
      item_id: e.itemId.startsWith('custom:') ? null : e.itemId,
      custom_label: e.itemId.startsWith('custom:') ? e.itemName : null,
      quantity: e.quantity || 1, source: e.source, sort_order: offset + i
    }))
    addRows(psr, 0)
    addRows(six, 100)
    if (rows.length > 0) await supabase.from('list_items').insert(rows)
    if (nid) {
      await supabase.from('list_section_notes').update({ notes }).eq('id', nid)
    } else if (notes.trim()) {
      const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, owner_id: uid, section: 'filtration', notes }).select().single()
      if (newNote) { setNotesId(newNote.id); notesIdRef.current = newNote.id }
    }
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updateEntry = (setFn: any, id: string, field: string, value: any) => setFn((prev: Entry[]) => prev.map((e: Entry) => e.id === id ? { ...e, [field]: value } : e))
  const removeEntry = (setFn: any, id: string, blankId: string) => setFn((prev: Entry[]) => {
    const next = prev.filter((e: Entry) => e.id !== id)
    return next.length > 0 ? next : [{ id: blankId, itemId: '', itemName: '', quantity: 1, source: 'rental' }]
  })
  const addEntry = (setFn: any) => setFn((prev: Entry[]) => [...prev, { id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, source: 'rental' }])

  const renderSection = (label: string, entries: Entry[], setFn: any, items: Item[], blankId: string) => (
    <div className="mb-6 last:mb-0">
      <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{label}</h4>
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id}>
            <div className="flex gap-2 items-center min-w-0">
              <div className="flex-1">
                <SearchablePicker items={items} value={entry.itemId}
                  onChange={(id, name) => { updateEntry(setFn, entry.id, 'itemId', id); updateEntry(setFn, entry.id, 'itemName', name); if (id) triggerAutoSave(600) }}
                  placeholder={"Search " + label + "..."} />
              </div>
              <input type="number" min="1"
                value={entry.quantity === 0 ? '' : entry.quantity}
                onChange={e => { updateEntry(setFn, entry.id, 'quantity', parseInt(e.target.value) || 0); triggerAutoSave(1000) }}
                className="w-12 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-3 text-sm focus:outline-none focus:border-[#FFE135] text-center" />
              <button onClick={() => removeEntry(setFn, entry.id, blankId + '_' + Date.now())} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
            </div>
            {entry.itemId && (
              <div className="flex gap-1 mt-1.5 ml-1">
                {['rental', 'dop_owned', 'ac_owned'].map(s => (
                  <button key={s} onClick={() => { updateEntry(setFn, entry.id, 'source', s); triggerAutoSave(300) }}
                    className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                    {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => addEntry(setFn)} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
        + Add another
      </button>
    </div>
  )

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
        <h2 className="text-2xl font-bold mb-2">Filtration</h2>
        <p className="text-zinc-500 text-sm mb-6">NDs, diffusion, polarisers and optical filters</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {renderSection('4x5.65" / PSR', psrEntries, setPsrEntries, psrItems, 'psr')}
          {renderSection('6x6"', sixEntries, setSixEntries, sixItems, 'six')}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Section notes</h3>
          <textarea value={sectionNotes} onChange={e => setSectionNotes(e.target.value)}
            placeholder="Any notes about filtration..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/lenses"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Lenses
          </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listId + "/aks" }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
            AKS →
          </button>
        </div>
      </main>
    </div>
  )
}
