'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }

const SUBCATEGORY_LABELS: Record<string, string> = {
  large_format: 'Large Format',
  super_35: 'Super 35',
  specialty: 'Specialty / Probe',
  vintage: 'Vintage',
}

function SearchablePicker({ items, value, onChange, placeholder, groupBy = 'brand' }: {
  items: Item[]
  value: string
  onChange: (id: string, name: string) => void
  placeholder: string
  groupBy?: 'brand' | 'subcategory'
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
    const key = groupBy === 'subcategory'
      ? (SUBCATEGORY_LABELS[item.subcategory || ''] || 'Other')
      : (item.brand || 'Other')
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
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
      />
      {value && (
        <button onClick={() => { onChange('', ''); setQuery('') }}
          className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 text-xs">clear</button>
      )}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {Object.keys(grouped).length === 0 ? (
            <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800"
              onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
              + Add "{query}" as custom item
            </button>
          ) : (
            <>
              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-widest bg-zinc-950">{group}</div>
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
                <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 border-t border-zinc-800"
                  onClick={() => { onChange('custom:' + query, query); setOpen(false) }}>
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

export default function LensesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lensRecordId, setLensRecordId] = useState<string | null>(null)

  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedPrimeSet, setSelectedPrimeSet] = useState('')
  const [selectedFocalLengths, setSelectedFocalLengths] = useState<string[]>([])
  const [selectedZooms, setSelectedZooms] = useState<string[]>([])
  const [selectedController, setSelectedController] = useState('')
  const [lensSource, setLensSource] = useState('rental')

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').order('name'),
      supabase.from('list_lenses').select('*, list_lens_zooms(*)').eq('list_id', lid).maybeSingle()
    ])
    if (eq) setAllItems(eq)
    if (existing) {
      setLensRecordId(existing.id)
      if (existing.prime_set_id) setSelectedPrimeSet(existing.prime_set_id)
      if (existing.focal_lengths) setSelectedFocalLengths(existing.focal_lengths)
      if (existing.zoom_controller) setSelectedController(existing.zoom_controller)
      if (existing.source) setLensSource(existing.source)
      if (existing.list_lens_zooms) setSelectedZooms(existing.list_lens_zooms.map((z: any) => z.item_id))
    }
  }

  const toggleFocal = (id: string) => {
    setSelectedFocalLengths(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleZoom = (id: string) => {
    setSelectedZooms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const save = async () => {
    setSaving(true)
    const focalNames = selectedFocalLengths.map(id => {
      const item = allItems.find(i => i.id === id)
      return item ? item.name : id
    })
    if (lensRecordId) {
      await supabase.from('list_lenses').update({
        prime_set_id: selectedPrimeSet && !selectedPrimeSet.startsWith('custom:') ? selectedPrimeSet : null,
        focal_lengths: focalNames,
        zoom_controller: (() => { const item = allItems.find(i => i.id === selectedController); return item ? item.name : selectedController; })(),
        source: lensSource
      }).eq('id', lensRecordId)
      await supabase.from('list_lens_zooms').delete().eq('list_lens_id', lensRecordId)
      if (selectedZooms.length > 0) {
        await supabase.from('list_lens_zooms').insert(selectedZooms.map(id => ({ list_lens_id: lensRecordId, item_id: id, source: lensSource })))
      }
    } else {
      const { data: newRecord } = await supabase.from('list_lenses').insert({
        list_id: listId,
        prime_set_id: selectedPrimeSet && !selectedPrimeSet.startsWith('custom:') ? selectedPrimeSet : null,
        focal_lengths: focalNames,
        zoom_controller: (() => { const item = allItems.find(i => i.id === selectedController); return item ? item.name : selectedController; })(),
        source: lensSource
      }).select().single()
      if (newRecord) {
        setLensRecordId(newRecord.id)
        if (selectedZooms.length > 0) {
          await supabase.from('list_lens_zooms').insert(selectedZooms.map(id => ({ list_lens_id: newRecord.id, item_id: id, source: lensSource })))
        }
      }
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const primeSets = allItems.filter(i => i.category === 'prime_set')
  const zooms = allItems.filter(i => i.category === 'zoom')
  const focalLengths = allItems.filter(i => i.category === 'focal_length').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
  const controllers = allItems.filter(i => i.category === 'controller')

  const zoomsBySubcat = zooms.reduce((acc: Record<string, Item[]>, item) => {
    const key = SUBCATEGORY_LABELS[item.subcategory || ''] || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

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
        <h2 className="text-2xl font-bold mb-8">Lenses</h2>
        <p className="text-zinc-500 text-sm -mt-6 mb-8">Lens package is shared across all cameras on this list</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Prime set</h3>
            <SearchablePicker items={primeSets} value={selectedPrimeSet} onChange={id => setSelectedPrimeSet(id)} placeholder="Search prime sets..." groupBy="subcategory" />
          </div>

          <div className="border-t border-zinc-800" />

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Focal lengths</h3>
            <div className="flex flex-wrap gap-2">
              {focalLengths.map(fl => (
                <button key={fl.id} onClick={() => toggleFocal(fl.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${ selectedFocalLengths.includes(fl.id) ? 'bg-orange-400 border-orange-400 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500' }`}>
                  {fl.name}
                </button>
              ))}
            </div>
            {selectedFocalLengths.length > 0 && (
              <p className="text-zinc-600 text-xs mt-3">{selectedFocalLengths.length} selected</p>
            )}
          </div>

          <div className="border-t border-zinc-800" />

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Zoom lenses</h3>
            {Object.entries(zoomsBySubcat).map(([subcat, subcatItems]) => (
              <div key={subcat} className="mb-4">
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2">{subcat}</div>
                <div className="space-y-1">
                  {subcatItems.map(item => (
                    <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${ selectedZooms.includes(item.id) ? 'bg-orange-400 border-orange-400' : 'border-zinc-600 group-hover:border-zinc-400' }`}
                        onClick={() => toggleZoom(item.id)}>
                        {selectedZooms.includes(item.id) && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div onClick={() => toggleZoom(item.id)} className="flex-1">
                        <span className="text-sm text-zinc-200">{item.name}</span>
                        {item.brand && <span className="text-xs text-zinc-600 ml-2">{item.brand}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800" />

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Zoom / focus controller</h3>
            <SearchablePicker items={controllers} value={selectedController} onChange={id => setSelectedController(id)} placeholder="Search controllers..." />
          </div>

          <div className="border-t border-zinc-800" />

          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Lens source</h3>
            <div className="flex gap-2">
              <button onClick={() => setLensSource('rental')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ lensSource === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>Rental house</button>
              <button onClick={() => setLensSource('dop_owned')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ lensSource === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>DOP owned</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}