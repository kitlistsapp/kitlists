'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null }
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
  const grouped = filtered.reduce((acc: Record<string, Item[]>, item) => {
    const key = item.subcategory || item.brand || 'Other'
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
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
      {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom
            </button>
          ) : (
            <>
              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{group}</div>
                  {groupItems.map(item => (
                    <button key={item.id} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
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

export default function PowerPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [onboardEntries, setOnboardEntries] = useState<Entry[]>([])
  const [blockEntries, setBlockEntries] = useState<Entry[]>([])
  const [acdcEntries, setAcdcEntries] = useState<Entry[]>([])

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').eq('category', 'power').order('name'),
      supabase.from('list_items').select('*, equipment_items(name, subcategory)').eq('list_id', lid).eq('section', 'power').order('sort_order')
    ])
    if (eq) setAllItems(eq)
    if (existing && existing.length > 0) {
      setOnboardEntries(existing.filter((i: any) => i.equipment_items?.subcategory === 'onboard').map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
      setBlockEntries(existing.filter((i: any) => i.equipment_items?.subcategory === 'block').map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
      setAcdcEntries(existing.filter((i: any) => i.equipment_items?.subcategory === 'acdc').map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || i.custom_label || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
    }
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('list_items').delete().eq('list_id', listId).eq('section', 'power')
    const rows: any[] = []
    const addRows = (entries: Entry[], idx_offset: number) => entries.filter(e => e.itemId).forEach((e, i) => rows.push({
      list_id: listId, owner_id: userId, section: 'power',
      item_id: e.itemId.startsWith('custom:') ? null : e.itemId,
      custom_label: e.itemId.startsWith('custom:') ? e.itemName : null,
      quantity: e.quantity || 1, source: e.source, sort_order: idx_offset + i
    }))
    addRows(onboardEntries, 0)
    addRows(blockEntries, 100)
    addRows(acdcEntries, 200)
    if (rows.length > 0) await supabase.from('list_items').insert(rows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const newEntry = () => ({ id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, source: 'rental' })
  const updateEntry = (setFn: any, id: string, field: string, value: any) => setFn((prev: Entry[]) => prev.map((e: Entry) => e.id === id ? { ...e, [field]: value } : e))
  const removeEntry = (setFn: any, id: string) => setFn((prev: Entry[]) => prev.filter((e: Entry) => e.id !== id))

  const onboardItems = allItems.filter(i => i.subcategory === 'onboard')
  const blockItems = allItems.filter(i => i.subcategory === 'block')
  const acdcItems = allItems.filter(i => i.subcategory === 'acdc')

  const renderEntries = (entries: Entry[], setFn: any, items: Item[], label: string, color: string) => (
    <div className="mb-6">
      <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{label}</h4>
      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <div key={entry.id}>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchablePicker items={items} value={entry.itemId}
                  onChange={(id, name) => { updateEntry(setFn, entry.id, 'itemId', id); updateEntry(setFn, entry.id, 'itemName', name) }}
                  placeholder={"Search " + label.toLowerCase() + "..."} />
              </div>
              <input type="number" min="1" placeholder="Qty"
                value={entry.quantity === 0 ? '' : entry.quantity}
                onChange={e => updateEntry(setFn, entry.id, 'quantity', parseInt(e.target.value) || 0)}
                className="w-16 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-400" />
              <button onClick={() => removeEntry(setFn, entry.id)} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
            </div>
            {entry.itemId && (
              <div className="flex gap-1 mt-1.5 ml-1">
                {['rental', 'dop_owned', 'ac_owned'].map(s => (
                  <button key={s} onClick={() => updateEntry(setFn, entry.id, 'source', s)}
                    className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                    {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => setFn((prev: Entry[]) => [...prev, newEntry()])}
        className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
        + Add {label.toLowerCase()}
      </button>
    </div>
  )

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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Power</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {renderEntries(onboardEntries, setOnboardEntries, onboardItems, 'Onboard', 'blue')}
          {renderEntries(blockEntries, setBlockEntries, blockItems, 'Block batteries', 'amber')}
          {renderEntries(acdcEntries, setAcdcEntries, acdcItems, 'AC/DC', 'purple')}
        </div>
      </main>
    </div>
  )
}
