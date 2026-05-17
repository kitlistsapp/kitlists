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

export default function LensesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Saved lenses (already in DB)
  const [savedLenses, setSavedLenses] = useState<SavedLens[]>([])

  // Browser state (pending additions)
  const [pendingKit, setPendingKit] = useState<Map<string, SelectedLens>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const { data: existing } = await supabase
      .from('list_lenses')
      .select('*')
      .eq('list_id', lid)
      .order('sort_order')
    if (existing) setSavedLenses(existing)
  }

  // Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    return searchIndex.filter(item => terms.every(t => item.label.includes(t))).slice(0, 40)
  }, [searchQuery])

  // Column data
  const categories = useMemo(() => Object.keys(data).sort(), [])
  const manufacturers = useMemo(() => selectedCategory ? Object.keys(data[selectedCategory]).sort() : [], [selectedCategory])
  const seriesList = useMemo(() => selectedCategory && selectedManufacturer ? Object.keys(data[selectedCategory][selectedManufacturer]).sort() : [], [selectedCategory, selectedManufacturer])
  const focalLengths = useMemo(() => selectedCategory && selectedManufacturer && selectedSeries ? data[selectedCategory][selectedManufacturer][selectedSeries] : [], [selectedCategory, selectedManufacturer, selectedSeries])

  const breadcrumb = [selectedCategory, selectedManufacturer, selectedSeries].filter(Boolean).join(' › ')
  const isModuleCategory = selectedCategory ? MODULE_CATEGORIES.includes(selectedCategory) : false

  // All keys currently in DB (so browser chips show as selected if already saved)
  const savedKeys = useMemo(() => new Set(savedLenses.map(l => `${l.category}|${l.manufacturer}|${l.series}|${l.focal_length}`)), [savedLenses])

  const togglePending = (lens: SelectedLens) => {
    const key = lensKey(lens)
    // If already saved to DB, don't add to pending (it's already there)
    if (savedKeys.has(key)) return
    setPendingKit(prev => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, lens)
      return next
    })
  }

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat)
    setSelectedManufacturer(null)
    setSelectedSeries(null)
  }

  const handleManufacturerSelect = (mfr: string) => {
    setSelectedManufacturer(mfr)
    setSelectedSeries(null)
  }

  const updateSavedSource = (id: string, source: string) => {
    setSavedLenses(prev => prev.map(l => l.id === id ? { ...l, source } : l))
  }

  const removeSaved = (id: string) => {
    setSavedLenses(prev => prev.filter(l => l.id !== id))
  }

  const save = async () => {
    setSaving(true)

    // Update source on existing saved lenses
    for (const lens of savedLenses) {
      await supabase.from('list_lenses').update({ source: lens.source }).eq('id', lens.id)
    }

    // Insert pending new lenses
    if (pendingKit.size > 0) {
      const existingCount = savedLenses.length
      const rows = Array.from(pendingKit.values()).map((lens, i) => ({
        list_id: listId,
        category: lens.category,
        manufacturer: lens.manufacturer,
        series: lens.series,
        focal_length: lens.focalLength,
        source: 'rental',
        sort_order: existingCount + i,
      }))
      const { data: inserted, error } = await supabase.from('list_lenses').insert(rows).select()
      if (error) { console.error('Failed to save lenses:', error) }
      else if (inserted) {
        setSavedLenses(prev => [...prev, ...inserted])
        setPendingKit(new Map())
      }
    }

    // Delete removed lenses (ones in DB but not in savedLenses anymore)
    // We track removals via removeSaved which filters from state;
    // on save we delete any DB rows not in current savedLenses
    const currentIds = new Set(savedLenses.map(l => l.id))
    const { data: dbLenses } = await supabase.from('list_lenses').select('id').eq('list_id', listId)
    if (dbLenses) {
      const toDelete = dbLenses.filter(l => !currentIds.has(l.id)).map(l => l.id)
      if (toDelete.length > 0) {
        await supabase.from('list_lenses').delete().in('id', toDelete)
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Group saved lenses by category for display
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
      {/* Nav */}
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
        <h2 className="text-2xl font-bold mb-6">Lenses</h2>

        {/* Lens browser panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
          {/* Browser header */}
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-300">Add lenses</h3>
              {breadcrumb
                ? <span className="text-xs text-zinc-500 truncate max-w-[60%] text-right">{breadcrumb}</span>
                : <span className="text-xs text-zinc-600">Browse by category or search</span>
              }
            </div>
            {/* Search */}
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search any lens, e.g. arri master 50mm"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-400 transition-colors"
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
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 border-b border-zinc-800 last:border-0 transition-colors ${inSaved ? 'text-zinc-600 cursor-default' : inPending ? 'bg-[#1a1000] text-orange-400' : 'text-zinc-200 hover:bg-zinc-800'}`}>
                          <span>
                            <span className="text-zinc-500 text-xs mr-1.5">{item.category}</span>
                            {item.manufacturer} {item.series} <span className="font-medium">{item.focalLength}</span>
                          </span>
                          {inSaved && <span className="text-zinc-600 text-xs flex-none">already added</span>}
                          {inPending && !inSaved && <span className="text-orange-400 text-xs flex-none">✓ added</span>}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Miller columns */}
          <div className="flex overflow-x-auto" style={{height: '320px'}}>
            {/* Category */}
            <div className="flex-none w-[130px] min-w-[130px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Category</div>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedCategory === cat ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Manufacturer */}
            <div className="flex-none w-[140px] min-w-[140px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Manufacturer</div>
              {!selectedCategory ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a category</div>
              ) : manufacturers.map(mfr => (
                <button key={mfr} onClick={() => handleManufacturerSelect(mfr)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedManufacturer === mfr ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {mfr}
                </button>
              ))}
            </div>

            {/* Series */}
            <div className="flex-none w-[150px] min-w-[150px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Series</div>
              {!selectedManufacturer ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a manufacturer</div>
              ) : seriesList.map(series => (
                <button key={series} onClick={() => setSelectedSeries(series)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedSeries === series ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {series}
                </button>
              ))}
            </div>

            {/* Focal lengths */}
            <div className="flex-1 min-w-[170px] overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">
                {isModuleCategory ? 'Modules' : 'Focal Lengths'}
              </div>
              {!selectedSeries ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a series</div>
              ) : (
                <div className="px-3 py-3 flex flex-wrap gap-1.5">
                  {focalLengths.map(fl => {
                    const lens: SelectedLens = { category: selectedCategory!, manufacturer: selectedManufacturer!, series: selectedSeries!, focalLength: fl }
                    const key = lensKey(lens)
                    const inPending = pendingKit.has(key)
                    const inSaved = savedKeys.has(key)
                    return (
                      <button key={fl} onClick={() => togglePending(lens)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${inSaved ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-default' : inPending ? 'bg-[#1a1000] border-orange-400 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}>
                        {fl}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Browser footer */}
          {pendingCount > 0 && (
            <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                <span className="text-orange-400 font-semibold">{pendingCount}</span> {pendingCount === 1 ? 'lens' : 'lenses'} pending
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPendingKit(new Map())} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
                <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Lens browser panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
          {/* Browser header */}
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-300">Add lenses</h3>
              {breadcrumb
                ? <span className="text-xs text-zinc-500 truncate max-w-[60%] text-right">{breadcrumb}</span>
                : <span className="text-xs text-zinc-600">Browse by category or search</span>
              }
            </div>
            {/* Search */}
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search any lens, e.g. arri master 50mm"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-400 transition-colors"
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
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 border-b border-zinc-800 last:border-0 transition-colors ${inSaved ? 'text-zinc-600 cursor-default' : inPending ? 'bg-[#1a1000] text-orange-400' : 'text-zinc-200 hover:bg-zinc-800'}`}>
                          <span>
                            <span className="text-zinc-500 text-xs mr-1.5">{item.category}</span>
                            {item.manufacturer} {item.series} <span className="font-medium">{item.focalLength}</span>
                          </span>
                          {inSaved && <span className="text-zinc-600 text-xs flex-none">already added</span>}
                          {inPending && !inSaved && <span className="text-orange-400 text-xs flex-none">✓ added</span>}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Miller columns */}
          <div className="flex overflow-x-auto" style={{height: '320px'}}>
            {/* Category */}
            <div className="flex-none w-[130px] min-w-[130px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Category</div>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedCategory === cat ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Manufacturer */}
            <div className="flex-none w-[140px] min-w-[140px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Manufacturer</div>
              {!selectedCategory ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a category</div>
              ) : manufacturers.map(mfr => (
                <button key={mfr} onClick={() => handleManufacturerSelect(mfr)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedManufacturer === mfr ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {mfr}
                </button>
              ))}
            </div>

            {/* Series */}
            <div className="flex-none w-[150px] min-w-[150px] border-r border-zinc-800 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">Series</div>
              {!selectedManufacturer ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a manufacturer</div>
              ) : seriesList.map(series => (
                <button key={series} onClick={() => setSelectedSeries(series)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedSeries === series ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                  {series}
                </button>
              ))}
            </div>

            {/* Focal lengths */}
            <div className="flex-1 min-w-[170px] overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-zinc-900 z-10">
                {isModuleCategory ? 'Modules' : 'Focal Lengths'}
              </div>
              {!selectedSeries ? (
                <div className="px-3 py-3 text-xs text-zinc-600">← Pick a series</div>
              ) : (
                <div className="px-3 py-3 flex flex-wrap gap-1.5">
                  {focalLengths.map(fl => {
                    const lens: SelectedLens = { category: selectedCategory!, manufacturer: selectedManufacturer!, series: selectedSeries!, focalLength: fl }
                    const key = lensKey(lens)
                    const inPending = pendingKit.has(key)
                    const inSaved = savedKeys.has(key)
                    return (
                      <button key={fl} onClick={() => togglePending(lens)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${inSaved ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-default' : inPending ? 'bg-[#1a1000] border-orange-400 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}>
                        {fl}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Browser footer */}
          {pendingCount > 0 && (
            <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                <span className="text-orange-400 font-semibold">{pendingCount}</span> {pendingCount === 1 ? 'lens' : 'lenses'} pending
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPendingKit(new Map())} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
                <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Saved lenses */}
        {Object.keys(groupedSaved).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
            {Object.entries(groupedSaved).map(([category, lenses]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{category}</h4>
                <div className="space-y-3">
                  {lenses.map(lens => (
                    <div key={lens.id}>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm">
                          {lens.manufacturer} {lens.series} <span className="text-orange-400 font-medium">{lens.focal_length}</span>
                        </div>
                        <button onClick={() => removeSaved(lens.id)} className="text-zinc-600 hover:text-red-400 text-lg">×</button>
                      </div>
                      <div className="flex gap-1 mt-1.5 ml-1">
                        {(['rental', 'dop_owned', 'ac_owned'] as const).map(s => (
                          <button key={s} onClick={() => updateSavedSource(lens.id, s)}
                            className={"px-2.5 py-1 rounded text-xs font-medium transition-colors " + (lens.source === s
                              ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-blue-500 text-white')
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

      </main>
    </div>
  )
}
