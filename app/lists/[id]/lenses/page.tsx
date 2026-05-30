'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import lensData from "@/app/data/lens_data.json"

type LensData = {
  [category: string]: {
    [manufacturer: string]: {
      [series: string]: string[]
    }
  }
}

type SelectedLens = {
  category: string
  manufacturer: string
  series: string
  focalLength: string
}

type SavedLens = {
  id: string
  category: string
  manufacturer: string
  series: string
  focal_length: string
  source: string
}

const data = lensData as LensData

const buildSearchIndex = () => {
  const index: Array<SelectedLens & { label: string }> = []
  for (const cat of Object.keys(data)) {
    for (const mfr of Object.keys(data[cat])) {
      for (const series of Object.keys(data[cat][mfr])) {
        for (const fl of data[cat][mfr][series]) {
          index.push({ category: cat, manufacturer: mfr, series, focalLength: fl, label: `${mfr} ${series} ${fl}`.toLowerCase() })
        }
      }
    }
  }
  return index
}

const searchIndex = buildSearchIndex()

function lensKey(l: SelectedLens) {
  return `${l.category}|${l.manufacturer}|${l.series}|${l.focalLength}`
}

const MODULE_CATEGORIES = ['Secondary lenses', 'PC / Tilt lenses', 'Probe / Snorkel', 'Effects lenses']

interface SimpleItem { id: string; name: string; brand: string | null; subcategory: string | null; category: string }
function SearchablePicker({ items, value, onChange, placeholder }: {
  items: SimpleItem[]; value: string; onChange: (id: string, name: string) => void; placeholder: string
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
  return (
    <div ref={ref} className="relative">
      <input type="text" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
      {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(item => (
            <button key={item.id} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
              onClick={() => { onChange(item.id, item.name); setQuery(item.name); setOpen(false) }}>
              {item.name}
            </button>
          ))}
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
  const [savedLenses, setSavedLenses] = useState<SavedLens[]>([])
  const [sectionNotes, setSectionNotes] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const [pendingKit, setPendingKit] = useState<Map<string, SelectedLens>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [zoomControllers, setZoomControllers] = useState<Array<{id: string; itemId: string; itemName: string; quantity: number; source: string}>>([])
  const [allZoomItems, setAllZoomItems] = useState<Array<{id: string; name: string}>>([])
  const zoomControllersRef = useRef<Array<{id: string; itemId: string; itemName: string; quantity: number; source: string}>>([])
  const userIdRef = useRef('')
  const searchRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const listIdRef = useRef('')
  const savedLensesRef = useRef<SavedLens[]>([])
  const pendingKitRef = useRef<Map<string, SelectedLens>>(new Map())
  const notesRef = useRef('')
  const notesIdRef = useRef<string | null>(null)

  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { savedLensesRef.current = savedLenses }, [savedLenses])
  useEffect(() => { pendingKitRef.current = pendingKit }, [pendingKit])
  useEffect(() => { notesRef.current = sectionNotes }, [sectionNotes])
  useEffect(() => { zoomControllersRef.current = zoomControllers }, [zoomControllers])
  useEffect(() => { notesIdRef.current = notesId }, [notesId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) userIdRef.current = user.id
    const [{ data: existing }, { data: notesData }, { data: zoomItems }, { data: existingZoom }] = await Promise.all([
      supabase.from('list_lenses').select('*').eq('list_id', lid).order('sort_order'),
      supabase.from('list_section_notes').select('*').eq('list_id', lid).eq('section', 'lenses').maybeSingle(),
      supabase.from('equipment_items').select('id, name').eq('category', 'lenses').eq('subcategory', 'zoom_controllers').order('name'),
      supabase.from('list_items').select('*, equipment_items(name)').eq('list_id', lid).eq('section', 'zoom_controllers').order('sort_order')
    ])
    if (existing) setSavedLenses(existing)
    if (notesData) { setSectionNotes(notesData.notes || ''); setNotesId(notesData.id) }
    if (zoomItems) setAllZoomItems(zoomItems)
    if (existingZoom && existingZoom.length > 0) {
      setZoomControllers(existingZoom.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
    } else {
      setZoomControllers([{ id: 'zc1', itemId: '', itemName: '', quantity: 1, source: 'rental' }])
    }
  }

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    return searchIndex.filter(item => terms.every(t => item.label.includes(t))).slice(0, 40)
  }, [searchQuery])

  const categories = useMemo(() => Object.keys(data).sort(), [])
  const manufacturers = useMemo(() => selectedCategory ? Object.keys(data[selectedCategory]).sort() : [], [selectedCategory])
  const seriesList = useMemo(() => selectedCategory && selectedManufacturer ? Object.keys(data[selectedCategory][selectedManufacturer]).sort() : [], [selectedCategory, selectedManufacturer])
  const focalLengths = useMemo(() => {
    if (!selectedCategory || !selectedManufacturer || !selectedSeries) return []
    const fls = data[selectedCategory][selectedManufacturer][selectedSeries]
    if (!Array.isArray(fls)) return []
    return [...fls].sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''))
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''))
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })
  }, [selectedCategory, selectedManufacturer, selectedSeries])

  const breadcrumb = [selectedCategory, selectedManufacturer, selectedSeries].filter(Boolean).join(' › ')
  const isModuleCategory = selectedCategory ? MODULE_CATEGORIES.includes(selectedCategory) : false
  const savedKeys = useMemo(() => new Set(savedLenses.map(l => `${l.category}|${l.manufacturer}|${l.series}|${l.focal_length}`)), [savedLenses])

  const togglePending = (lens: SelectedLens) => {
    const key = lensKey(lens)
    if (savedKeys.has(key)) return
    setPendingKit(prev => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else { next.set(key, lens); triggerAutoSave(800) }
      return next
    })
  }

  const handleCategorySelect = (cat: string) => { setSelectedCategory(cat); setSelectedManufacturer(null); setSelectedSeries(null) }
  const handleManufacturerSelect = (mfr: string) => { setSelectedManufacturer(mfr); setSelectedSeries(null) }
  const updateSavedSource = (id: string, source: string) => setSavedLenses(prev => prev.map(l => l.id === id ? { ...l, source } : l))
  const removeSaved = (id: string) => setSavedLenses(prev => prev.filter(l => l.id !== id))

  const triggerAutoSave = (delay = 800) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveWithRefs(), delay)
  }

  const saveWithRefs = async () => {
    const lid = listIdRef.current
    const savedL = savedLensesRef.current
    const pending = pendingKitRef.current
    const notes = notesRef.current
    const nid = notesIdRef.current
    if (!lid) return
    setSaving(true)
    const currentIds = new Set(savedL.map(l => l.id).filter(Boolean))
    const { data: dbLenses } = await supabase.from('list_lenses').select('id').eq('list_id', lid)
    if (dbLenses) {
      const toDelete = dbLenses.filter(l => !currentIds.has(l.id)).map(l => l.id)
      if (toDelete.length > 0) await supabase.from('list_lenses').delete().in('id', toDelete)
    }
    for (const lens of savedL) {
      await supabase.from('list_lenses').update({ source: lens.source }).eq('id', lens.id)
    }
    if (pending.size > 0) {
      const rows = Array.from(pending.values()).map((lens, i) => ({
        list_id: lid, category: lens.category, manufacturer: lens.manufacturer,
        series: lens.series, focal_length: lens.focalLength, source: 'rental', sort_order: savedL.length + i,
      }))
      const { data: inserted, error } = await supabase.from('list_lenses').insert(rows).select()
      if (!error && inserted) { setSavedLenses(prev => [...prev, ...inserted]); setPendingKit(new Map()) }
    }
    if (nid) {
      await supabase.from('list_section_notes').update({ notes }).eq('id', nid)
    } else if (notes.trim()) {
      const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, section: 'lenses', notes }).select().single()
      if (newNote) setNotesId(newNote.id)
    }
    // Save zoom controllers
    const zc = zoomControllersRef.current
    const uid = userIdRef.current
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'zoom_controllers')
    const zcRows = zc.filter(e => e.itemId).map((e, i) => ({
      list_id: lid, owner_id: uid, section: 'zoom_controllers',
      item_id: e.itemId, quantity: e.quantity || 1, source: e.source, sort_order: i
    }))
    if (zcRows.length > 0) await supabase.from('list_items').insert(zcRows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const save = async () => {
    setSaving(true)

    // 1. Delete any rows the user removed (in DB but not in savedLenses state)
    const currentIds = new Set(savedLenses.map(l => l.id).filter(Boolean))
    const { data: dbLenses } = await supabase.from('list_lenses').select('id').eq('list_id', listId)
    if (dbLenses) {
      const toDelete = dbLenses.filter(l => !currentIds.has(l.id)).map(l => l.id)
      if (toDelete.length > 0) await supabase.from('list_lenses').delete().in('id', toDelete)
    }

    // 2. Update source on existing saved lenses
    for (const lens of savedLenses) {
      await supabase.from('list_lenses').update({ source: lens.source }).eq('id', lens.id)
    }

    // 3. Insert pending new lenses
    if (pendingKit.size > 0) {
      const rows = Array.from(pendingKit.values()).map((lens, i) => ({
        list_id: listId, category: lens.category, manufacturer: lens.manufacturer,
        series: lens.series, focal_length: lens.focalLength, source: 'rental', sort_order: savedLenses.length + i,
      }))
      const { data: inserted, error } = await supabase.from('list_lenses').insert(rows).select()
      if (!error && inserted) { setSavedLenses(prev => [...prev, ...inserted]); setPendingKit(new Map()) }
    }

    // Save section notes
    if (notesId) {
      await supabase.from('list_section_notes').update({ notes: sectionNotes }).eq('id', notesId)
    } else if (sectionNotes.trim()) {
      const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: listId, section: 'lenses', notes: sectionNotes }).select().single()
      if (newNote) setNotesId(newNote.id)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const groupedSaved = useMemo(() => {
    const groups: Record<string, SavedLens[]> = {}
    for (const lens of savedLenses) {
      if (!groups[lens.category]) groups[lens.category] = []
      groups[lens.category].push(lens)
    }
    return groups
  }, [savedLenses])

  const pendingCount = pendingKit.size

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Lenses</h2>

        {/* Lens browser panel — always first */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-300">Add lenses</h3>
              {breadcrumb
                ? <span className="text-xs text-zinc-500 truncate max-w-[60%] text-right">{breadcrumb}</span>
                : <span className="text-xs text-zinc-600">Browse by category or search</span>
              }
            </div>
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search any lens, e.g. arri master 50mm"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFE135] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); searchRef.current?.focus() }} className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
              )}
              {searchFocused && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg z-50 max-h-64 overflow-y-auto shadow-xl">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500">No lenses found</div>
                  ) : (
                    searchResults.map(item => {
                      const key = lensKey(item)
                      const inPending = pendingKit.has(key)
                      const inSaved = savedKeys.has(key)
                      return (
                        <button key={key} onMouseDown={() => togglePending(item)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 border-b border-zinc-800 last:border-0 transition-colors ${inSaved ? 'text-zinc-600 cursor-default' : inPending ? 'bg-[#2a2000] text-[#FFE135]' : 'text-zinc-200 hover:bg-zinc-800'}`}>
                          <span>
                            <span className="text-zinc-500 text-xs mr-1.5">{item.category}</span>
                            {item.manufacturer} {item.series} <span className="font-medium">{item.focalLength}</span>
                          </span>
                          {inSaved && <span className="text-zinc-600 text-xs flex-none">already added</span>}
                          {inPending && !inSaved && <span className="text-[#FFE135] text-xs flex-none">✓ added</span>}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex overflow-x-auto" style={{height: '320px'}}>
            <div className="flex-1 min-w-[120px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Category</div>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedCategory === cat ? 'bg-[#2a2000] text-[#FFE135] border-r-2 border-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[120px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Manufacturer</div>
              {!selectedCategory ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a category</div>
              ) : manufacturers.map(mfr => (
                <button key={mfr} onClick={() => handleManufacturerSelect(mfr)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedManufacturer === mfr ? 'bg-[#2a2000] text-[#FFE135] border-r-2 border-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {mfr}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[120px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Series</div>
              {!selectedManufacturer ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a manufacturer</div>
              ) : seriesList.map(series => (
                <button key={series} onClick={() => setSelectedSeries(series)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedSeries === series ? 'bg-[#2a2000] text-[#FFE135] border-r-2 border-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {series}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[120px] overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">
                'Focal Lengths'
              </div>
              {!selectedSeries ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a series</div>
              ) : (
                <div className="py-1">
                  {focalLengths.map(fl => {
                    const lens: SelectedLens = { category: selectedCategory!, manufacturer: selectedManufacturer!, series: selectedSeries!, focalLength: fl }
                    const key = lensKey(lens)
                    const inPending = pendingKit.has(key)
                    const inSaved = savedKeys.has(key)
                    return (
                      <button key={fl} onClick={() => togglePending(lens)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium border-b border-zinc-800 last:border-0 transition-colors ${inSaved ? 'text-zinc-600 cursor-default' : inPending ? 'bg-[#2a2000] text-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                        {inPending && !inSaved ? '✓ ' : ''}{fl}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                <span className="text-[#FFE135] font-semibold">{pendingCount}</span> {pendingCount === 1 ? 'lens' : 'lenses'} pending
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPendingKit(new Map())} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
                <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved lenses — below browser */}
        {Object.keys(groupedSaved).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {Object.entries(groupedSaved).map(([category, lenses]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{category}</h4>
                <div className="space-y-3">
                  {lenses.map(lens => (
                    <div key={lens.id}>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm">
                          {lens.manufacturer} {lens.series} <span className="text-[#FFE135] font-medium">{lens.focal_length}</span>
                        </div>
                        <button onClick={() => removeSaved(lens.id)} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
                      </div>
                      <div className="flex gap-1 mt-1.5 ml-1">
                        {(['rental', 'dop_owned', 'ac_owned'] as const).map(s => (
                          <button key={s} onClick={() => updateSavedSource(lens.id, s)}
                            className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (lens.source === s
                              ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white')
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                            {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Zoom Controllers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Zoom Controllers</h3>
          <div className="space-y-3">
            {zoomControllers.map(entry => (
              <div key={entry.id}>
                <div className="flex gap-2 items-center min-w-0">
                  <div className="flex-1">
                    <SearchablePicker
                      items={allZoomItems.map(i => ({ id: i.id, name: i.name, brand: null, subcategory: null, category: 'lenses' }))}
                      value={entry.itemId}
                      onChange={(id, name) => {
                        setZoomControllers(prev => prev.map(z => z.id === entry.id ? { ...z, itemId: id, itemName: name } : z))
                        if (id) triggerAutoSave(600)
                      }}
                      placeholder="Search zoom controllers..."
                    />
                  </div>
                  <input type="number" min="1"
                    value={entry.quantity === 0 ? '' : entry.quantity}
                    onChange={e => { setZoomControllers(prev => prev.map(z => z.id === entry.id ? { ...z, quantity: parseInt(e.target.value) || 0 } : z)); triggerAutoSave(1000) }}
                    className="w-12 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-3 text-sm focus:outline-none focus:border-[#FFE135] text-center" />
                  <button onClick={() => setZoomControllers(prev => prev.filter(z => z.id !== entry.id).length > 0 ? prev.filter(z => z.id !== entry.id) : [{ id: 'zc_blank', itemId: '', itemName: '', quantity: 1, source: 'rental' }])}
                    className="text-zinc-600 hover:text-red-400 text-lg">×</button>
                </div>
                {entry.itemId && (
                  <div className="flex gap-1 mt-1.5 ml-1">
                    {['rental', 'dop_owned', 'ac_owned'].map(s => (
                      <button key={s} onClick={() => { setZoomControllers(prev => prev.map(z => z.id === entry.id ? { ...z, source: s } : z)); triggerAutoSave(300) }}
                        className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (entry.source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}>
                        {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP owned' : 'AC owned'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setZoomControllers(prev => [...prev, { id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, source: 'rental' }])}
            className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
            + Add another
          </button>
        </div>

        {/* Section notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Section notes</h3>
          <textarea value={sectionNotes} onChange={e => setSectionNotes(e.target.value)}
            placeholder="Any notes about lenses..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/power"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
              ← Power
            </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listId + "/filtration"; }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
              Filtration →
            </button>
        </div>
      </main>
    </div>
  )
}
