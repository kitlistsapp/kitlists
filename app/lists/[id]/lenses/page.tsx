'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"

interface LensLibrary { id: string; manufacturer: string; category: string | null; sub_category: string | null; lens_name: string }
interface SavedLens { id: string; lens_library_id: string; lens_name: string; source: string }

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
        className={"w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] " + (value ? "pr-12" : "")} />
      {value && <button onClick={() => { onChange('', ''); setQuery('') }} className="absolute right-3 top-3 text-zinc-400 hover:text-white text-base leading-none">×</button>}
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
  const [allLenses, setAllLenses] = useState<LensLibrary[]>([])
  const [loadingLenses, setLoadingLenses] = useState(true)
  const [savedLenses, setSavedLenses] = useState<SavedLens[]>([])
  const [sectionNotes, setSectionNotes] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selMfr, setSelMfr] = useState<string | null>(null)
  const [selCat, setSelCat] = useState<string | null>(null)
  const [selSubCat, setSelSubCat] = useState<string | null>(null)
  const [zoomControllers, setZoomControllers] = useState<Array<{id: string; itemId: string; itemName: string; quantity: number; source: string}>>([])
  const [allZoomItems, setAllZoomItems] = useState<Array<{id: string; name: string}>>([])

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const listIdRef = useRef('')
  const userIdRef = useRef('')
  const savedLensesRef = useRef<SavedLens[]>([])
  const notesRef = useRef('')
  const notesIdRef = useRef<string | null>(null)
  const zoomControllersRef = useRef<Array<{id: string; itemId: string; itemName: string; quantity: number; source: string}>>([])

  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { savedLensesRef.current = savedLenses }, [savedLenses])
  useEffect(() => { notesRef.current = sectionNotes }, [sectionNotes])
  useEffect(() => { notesIdRef.current = notesId }, [notesId])
  useEffect(() => { zoomControllersRef.current = zoomControllers }, [zoomControllers])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
    fetchAllLenses()
  }, [])

  const fetchAllLenses = async () => {
    let all: LensLibrary[] = []
    let from = 0
    const batch = 1000
    while (true) {
      const { data } = await supabase.from('lens_library').select('*').order('manufacturer').order('category').order('sub_category').order('lens_name').range(from, from + batch - 1)
      if (!data || data.length === 0) break
      all = [...all, ...data]
      if (data.length < batch) break
      from += batch
    }
    setAllLenses(all)
    setLoadingLenses(false)
  }

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) userIdRef.current = user.id
    const [{ data: existing }, { data: notesData }, { data: zoomItems }, { data: existingZoom }] = await Promise.all([
      supabase.from('list_lenses').select('*').eq('list_id', lid).order('sort_order'),
      supabase.from('list_section_notes').select('*').eq('list_id', lid).eq('section', 'lenses').maybeSingle(),
      supabase.from('equipment_items').select('id, name').eq('category', 'lenses').eq('subcategory', 'zoom_controllers').order('name'),
      supabase.from('list_items').select('*, equipment_items(name)').eq('list_id', lid).eq('section', 'zoom_controllers').order('sort_order')
    ])
    if (existing) {
      setSavedLenses(existing.map((l: any) => ({
        id: l.id,
        lens_library_id: l.lens_library_id || '',
        lens_name: l.lens_name || `${l.manufacturer || ''} ${l.series || ''} ${l.focal_length || ''}`.trim(),
        source: l.source || 'rental'
      })))
    }
    if (notesData) { setSectionNotes(notesData.notes || ''); setNotesId(notesData.id) }
    if (zoomItems) setAllZoomItems(zoomItems)
    if (existingZoom && existingZoom.length > 0) {
      setZoomControllers(existingZoom.map((i: any) => ({ id: i.id, itemId: i.item_id || '', itemName: i.equipment_items?.name || '', quantity: i.quantity || 1, source: i.source || 'rental' })))
    } else {
      setZoomControllers([])
    }
  }

  const triggerAutoSave = (delay = 800) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveWithRefs(), delay)
  }

  const saveWithRefs = async () => {
    const lid = listIdRef.current
    const savedL = savedLensesRef.current
    const notes = notesRef.current
    const nid = notesIdRef.current
    const uid = userIdRef.current
    const zc = zoomControllersRef.current
    if (!lid) return
    setSaving(true)

    const currentIds = new Set(savedL.map(l => l.id).filter(Boolean))
    const { data: dbLenses } = await supabase.from('list_lenses').select('id').eq('list_id', lid)
    if (dbLenses) {
      const toDelete = dbLenses.filter(l => !currentIds.has(l.id)).map(l => l.id)
      if (toDelete.length > 0) await supabase.from('list_lenses').delete().in('id', toDelete)
    }
    for (const lens of savedL) {
      if (lens.id) await supabase.from('list_lenses').update({ source: lens.source }).eq('id', lens.id)
    }
    if (nid) {
      await supabase.from('list_section_notes').update({ notes }).eq('id', nid)
    } else if (notes.trim()) {
      const { data: existing } = await supabase.from('list_section_notes').select('id').eq('list_id', lid).eq('section', 'lenses').maybeSingle()
      if (existing) {
        await supabase.from('list_section_notes').update({ notes }).eq('id', existing.id)
        setNotesId(existing.id); notesIdRef.current = existing.id
      } else {
        const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, owner_id: uid, section: 'lenses', notes }).select().single()
        if (newNote) { setNotesId(newNote.id); notesIdRef.current = newNote.id }
      }
    }
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
    const lid = listId
    const uid = userIdRef.current

    const currentIds = new Set(savedLenses.map(l => l.id).filter(Boolean))
    const { data: dbLenses } = await supabase.from('list_lenses').select('id').eq('list_id', lid)
    if (dbLenses) {
      const toDelete = dbLenses.filter(l => !currentIds.has(l.id)).map(l => l.id)
      if (toDelete.length > 0) await supabase.from('list_lenses').delete().in('id', toDelete)
    }
    for (const lens of savedLenses) {
      if (lens.id) await supabase.from('list_lenses').update({ source: lens.source }).eq('id', lens.id)
    }
    if (notesId) {
      await supabase.from('list_section_notes').update({ notes: sectionNotes }).eq('id', notesId)
    } else if (sectionNotes.trim()) {
      const { data: existing } = await supabase.from('list_section_notes').select('id').eq('list_id', lid).eq('section', 'lenses').maybeSingle()
      if (existing) {
        await supabase.from('list_section_notes').update({ notes: sectionNotes }).eq('id', existing.id)
        setNotesId(existing.id)
      } else {
        const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, owner_id: uid, section: 'lenses', notes: sectionNotes }).select().single()
        if (newNote) setNotesId(newNote.id)
      }
    }
    await supabase.from('list_items').delete().eq('list_id', lid).eq('section', 'zoom_controllers')
    const zcRows = zoomControllers.filter(e => e.itemId).map((e, i) => ({
      list_id: lid, owner_id: uid, section: 'zoom_controllers',
      item_id: e.itemId, quantity: e.quantity || 1, source: e.source, sort_order: i
    }))
    if (zcRows.length > 0) await supabase.from('list_items').insert(zcRows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addLens = async (lens: LensLibrary) => {
    if (savedLenses.some(l => l.lens_library_id === lens.id)) return
    const lid = listIdRef.current
    const { data: inserted } = await supabase.from('list_lenses').insert({
      list_id: lid,
      lens_library_id: lens.id,
      lens_name: lens.lens_name,
      source: 'rental',
      sort_order: savedLenses.length
    }).select().single()
    if (inserted) {
      setSavedLenses(prev => [...prev, { id: inserted.id, lens_library_id: lens.id, lens_name: lens.lens_name, source: 'rental' }])
    }
  }

  const removeSaved = async (id: string) => {
    await supabase.from('list_lenses').delete().eq('id', id)
    setSavedLenses(prev => prev.filter(l => l.id !== id))
  }

  const updateSource = (id: string, source: string) => {
    setSavedLenses(prev => prev.map(l => l.id === id ? { ...l, source } : l))
    triggerAutoSave(400)
  }

  const isAdded = (lens: LensLibrary) => savedLenses.some(l => l.lens_library_id === lens.id)

  const searchResults = search.trim().length > 1
    ? allLenses.filter(l =>
        l.lens_name.toLowerCase().includes(search.toLowerCase()) ||
        l.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
        (l.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.sub_category || '').toLowerCase().includes(search.toLowerCase())
      ).slice(0, 50)
    : []

  const manufacturers = [...new Set(allLenses.map(l => l.manufacturer))].sort()
  const mfrLenses = selMfr ? allLenses.filter(l => l.manufacturer === selMfr) : []
  const categories = [...new Set(mfrLenses.filter(l => l.category).map(l => l.category as string))].sort()
  const catLenses = selCat ? mfrLenses.filter(l => l.category === selCat) : mfrLenses
  const subCategories = [...new Set(catLenses.filter(l => l.sub_category).map(l => l.sub_category as string))].sort()
  const hasSubCats = subCategories.length > 0
  const finalLenses = hasSubCats && selSubCat
    ? catLenses.filter(l => l.sub_category === selSubCat)
    : !hasSubCats && selCat ? catLenses : []
  const showLensCol = (!hasSubCats && selCat) || (hasSubCats && selSubCat)

  const colClass = "border-r border-zinc-800 overflow-y-auto flex flex-col min-w-0"
  const hdrClass = "px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800"
  const itemCls = (active: boolean) => `w-full text-left px-3 py-2 text-xs leading-snug transition-colors flex items-center justify-between ${active ? 'bg-[#2a2000] text-[#FFE135] border-r-2 border-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`

  const groupedSaved = savedLenses.reduce((acc: Record<string, SavedLens[]>, l) => {
    const lib = allLenses.find(a => a.id === l.lens_library_id)
    const group = lib?.manufacturer || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(l)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
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

        {/* Lens browser */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-300">Add lenses</h3>
              <span className="text-xs text-zinc-600">{loadingLenses ? 'Loading...' : `${allLenses.length.toLocaleString()} lenses`}</span>
            </div>
            <div className="relative">
              <input type="text" value={search}
                onChange={e => { setSearch(e.target.value); setSelMfr(null); setSelCat(null); setSelSubCat(null) }}
                placeholder="Search any lens, e.g. Master Prime, Cooke S4, Signature Zoom..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] pr-10"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-zinc-500 hover:text-white text-lg">×</button>}
            </div>
            {search.trim().length > 1 && (
              <div className="mt-2 max-h-56 overflow-y-auto border border-zinc-800 rounded-lg">
                {searchResults.length === 0
                  ? <p className="text-zinc-500 text-xs px-3 py-2">No results</p>
                  : searchResults.map(l => (
                    <div key={l.id} className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{l.lens_name}</p>
                        <p className="text-xs text-zinc-600">{l.manufacturer}{l.category ? ` · ${l.category}` : ''}</p>
                      </div>
                      <button onClick={() => { addLens(l); setSearch('') }}
                        className={`text-xs px-2.5 py-1 rounded-lg ml-2 flex-shrink-0 transition-colors ${isAdded(l) ? 'bg-zinc-700 text-zinc-500' : 'bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold'}`}>
                        {isAdded(l) ? '✓' : '+ Add'}
                      </button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Miller columns */}
          {!search.trim() && (
            <div className="flex overflow-x-auto" style={{height: '320px'}}>
              {/* Manufacturer */}
              <div className={colClass} style={{minWidth: '130px', flex: 1}}>
                <div className={hdrClass}>Manufacturer</div>
                {loadingLenses
                  ? <p className="px-3 py-3 text-xs text-zinc-600">Loading...</p>
                  : manufacturers.map(m => (
                    <button key={m} className={itemCls(selMfr === m)} onClick={() => { setSelMfr(m); setSelCat(null); setSelSubCat(null) }}>
                      <span className="truncate">{m}</span>
                      <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ))
                }
              </div>

              {/* Category */}
              <div className={colClass} style={{minWidth: '130px', flex: 1}}>
                <div className={hdrClass}>Category</div>
                {!selMfr
                  ? <p className="px-3 py-3 text-xs text-zinc-600">← Pick a manufacturer</p>
                  : categories.length === 0
                    ? <p className="px-3 py-3 text-xs text-zinc-600">No categories</p>
                    : categories.map(c => (
                        <button key={c} className={itemCls(selCat === c)} onClick={() => { setSelCat(c); setSelSubCat(null) }}>
                          <span className="truncate">{c}</span>
                          <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </button>
                      ))
                }
              </div>

              {/* Sub category — only if exists */}
              {hasSubCats && (
                <div className={colClass} style={{minWidth: '130px', flex: 1}}>
                  <div className={hdrClass}>Sub category</div>
                  {!selCat
                    ? <p className="px-3 py-3 text-xs text-zinc-600">← Pick a category</p>
                    : subCategories.map(s => (
                        <button key={s} className={itemCls(selSubCat === s)} onClick={() => setSelSubCat(s)}>
                          <span className="truncate">{s}</span>
                          <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </button>
                      ))
                  }
                </div>
              )}

              {/* Lens */}
              <div className="flex-1 overflow-y-auto flex flex-col min-w-0" style={{minWidth: '150px'}}>
                <div className={hdrClass}>Lens</div>
                {!showLensCol
                  ? <p className="px-3 py-3 text-xs text-zinc-600">{hasSubCats ? '← Pick a sub category' : selMfr ? '← Pick a category' : '← Pick a manufacturer'}</p>
                  : finalLenses.length === 0
                    ? <p className="px-3 py-3 text-xs text-zinc-600">No lenses found</p>
                    : finalLenses.map(l => (
                        <button key={l.id}
                          className={`w-full text-left px-3 py-2 text-xs border-b border-zinc-800 flex items-center justify-between transition-colors ${isAdded(l) ? 'text-zinc-600 cursor-default' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                          onClick={() => !isAdded(l) && addLens(l)}>
                          <span className="truncate leading-snug">{l.lens_name}</span>
                          {isAdded(l)
                            ? <span className="text-zinc-600 flex-shrink-0 ml-1 text-[10px]">✓</span>
                            : <span className="text-[#FFE135] flex-shrink-0 ml-1">+</span>
                          }
                        </button>
                      ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Saved lenses */}
        {savedLenses.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
            {Object.entries(groupedSaved).map(([mfr, lenses]) => (
              <div key={mfr} className="mb-6 last:mb-0">
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{mfr}</h4>
                <div className="space-y-3">
                  {lenses.map(lens => (
                    <div key={lens.id}>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm">
                          {lens.lens_name}
                        </div>
                        <button onClick={() => removeSaved(lens.id)} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
                      </div>
                      <div className="flex gap-1 mt-1.5 ml-1">
                        {(['rental', 'dop_owned', 'ac_owned'] as const).map(s => (
                          <button key={s} onClick={() => updateSource(lens.id, s)}
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
                      onChange={(id, name) => { setZoomControllers(prev => prev.map(z => z.id === entry.id ? { ...z, itemId: id, itemName: name } : z)); if (id) triggerAutoSave(600) }}
                      placeholder="Search zoom controllers..."
                    />
                  </div>
                  {entry.itemId && (
                    <input type="number" min="1"
                      value={entry.quantity === 0 ? '' : entry.quantity}
                      onChange={e => { setZoomControllers(prev => prev.map(z => z.id === entry.id ? { ...z, quantity: parseInt(e.target.value) || 0 } : z)); triggerAutoSave(1000) }}
                      className="w-12 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-3 text-sm focus:outline-none focus:border-[#FFE135] text-center" />
                  )}
                  <button onClick={() => setZoomControllers(prev => prev.filter(z => z.id !== entry.id))}
                    className={"text-lg " + (entry.itemId ? "text-zinc-600 hover:text-red-400" : "text-zinc-700 hover:text-zinc-400")}>×</button>
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
            + Add zoom controller
          </button>
        </div>

        {/* Section notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Section notes</h3>
          <textarea value={sectionNotes} onChange={e => { setSectionNotes(e.target.value); triggerAutoSave(1000) }}
            placeholder="Any notes about lenses..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/power"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Power
          </a>
          <button onClick={async () => { await save(); window.location.href = "/lists/" + listId + "/filtration" }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors disabled:opacity-50">
            Filtration →
          </button>
        </div>
      </main>
    </div>
  )
}
