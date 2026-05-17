'use client'

import { useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import lensData from '../../data/lens_data.json'

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

export default function LensesPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)
  const [kit, setKit] = useState<Map<string, SelectedLens>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    return searchIndex.filter(item => terms.every(t => item.label.includes(t))).slice(0, 40)
  }, [searchQuery])

  const categories = useMemo(() => Object.keys(data).sort(), [])
  const manufacturers = useMemo(() => selectedCategory ? Object.keys(data[selectedCategory]).sort() : [], [selectedCategory])
  const seriesList = useMemo(() => selectedCategory && selectedManufacturer ? Object.keys(data[selectedCategory][selectedManufacturer]).sort() : [], [selectedCategory, selectedManufacturer])
  const focalLengths = useMemo(() => selectedCategory && selectedManufacturer && selectedSeries ? data[selectedCategory][selectedManufacturer][selectedSeries] : [], [selectedCategory, selectedManufacturer, selectedSeries])

  const breadcrumb = [selectedCategory, selectedManufacturer, selectedSeries].filter(Boolean).join(' › ')

  const toggleLens = (lens: SelectedLens) => {
    const key = lensKey(lens)
    setKit(prev => {
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

  const handleSave = async () => {
    if (!kit.size) return
    const supabase = createClient()
    const rows = Array.from(kit.values()).map((lens, i) => ({
      list_id: listId,
      category: lens.category,
      manufacturer: lens.manufacturer,
      series: lens.series,
      focal_length: lens.focalLength,
      sort_order: i,
    }))
    const { error } = await supabase.from('list_lenses').insert(rows)
    if (error) { console.error('Failed to save lenses:', error); return }
    router.push(`/lists/${listId}`)
  }

  const kitCount = kit.size
  const isModuleCategory = selectedCategory ? MODULE_CATEGORIES.includes(selectedCategory) : false

  return (
    <div className="flex flex-col h-screen bg-black text-white select-none">
      <div className="flex-none px-4 pt-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-base font-semibold tracking-tight text-white">Lens Browser</h1>
          {breadcrumb ? (
            <span className="text-xs text-zinc-500 truncate max-w-[60%] text-right">{breadcrumb}</span>
          ) : (
            <span className="text-xs text-zinc-600">Select a category</span>
          )}
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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-400 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); searchRef.current?.focus() }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
          )}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md z-50 max-h-64 overflow-y-auto shadow-xl">
              {searchResults.length === 0 ? (
                <div className="px-3 py-3 text-xs text-zinc-500">No lenses found</div>
              ) : (
                searchResults.map(item => {
                  const key = lensKey(item)
                  const inKit = kit.has(key)
                  return (
                    <button key={key} onMouseDown={() => toggleLens(item)} className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 border-b border-zinc-800 last:border-0 transition-colors ${inKit ? 'bg-[#1a1000] text-orange-400' : 'text-zinc-200 hover:bg-zinc-800'}`}>
                      <span>
                        <span className="text-zinc-500 text-xs mr-1.5">{item.category}</span>
                        {item.manufacturer} {item.series} <span className="font-medium">{item.focalLength}</span>
                      </span>
                      {inKit && <span className="text-orange-400 text-xs flex-none">✓ added</span>}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-x-auto">
          <div className="flex-none w-[130px] min-w-[130px] border-r border-zinc-800 overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-black z-10">Category</div>
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedCategory === cat ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-none w-[140px] min-w-[140px] border-r border-zinc-800 overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-black z-10">Manufacturer</div>
            {!selectedCategory ? (
              <div className="px-3 py-3 text-xs text-zinc-600">← Pick a category</div>
            ) : (
              manufacturers.map(mfr => (
                <button key={mfr} onClick={() => handleManufacturerSelect(mfr)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedManufacturer === mfr ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}>
                  {mfr}
                </button>
              ))
            )}
          </div>

          <div className="flex-none w-[150px] min-w-[150px] border-r border-zinc-800 overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-black z-10">Series</div>
            {!selectedManufacturer ? (
              <div className="px-3 py-3 text-xs text-zinc-600">← Pick a manufacturer</div>
            ) : (
              seriesList.map(series => (
                <button key={series} onClick={() => setSelectedSeries(series)} className={`w-full text-left px-3 py-2 text-xs leading-snug transition-colors ${selectedSeries === series ? 'bg-[#1a1000] text-orange-400 border-r-2 border-orange-400' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}>
                  {series}
                </button>
              ))
            )}
          </div>

          <div className="flex-none w-[170px] min-w-[170px] overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 sticky top-0 bg-black z-10">
              {isModuleCategory ? 'Modules' : 'Focal Lengths'}
            </div>
            {!selectedSeries ? (
              <div className="px-3 py-3 text-xs text-zinc-600">← Pick a series</div>
            ) : (
              <div className="px-2 py-2 flex flex-wrap gap-1.5">
                {focalLengths.map(fl => {
                  const lens: SelectedLens = { category: selectedCategory!, manufacturer: selectedManufacturer!, series: selectedSeries!, focalLength: fl }
                  const key = lensKey(lens)
                  const inKit = kit.has(key)
                  return (
                    <button key={fl} onClick={() => toggleLens(lens)} className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${inKit ? 'bg-[#1a1000] border-orange-400 text-orange-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}>
                      {fl}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-zinc-800 px-4 py-3 bg-black flex items-center justify-between gap-3">
        <div className="text-sm">
          {kitCount === 0 ? (
            <span className="text-zinc-600">No lenses selected</span>
          ) : (
            <span><span className="text-orange-400 font-semibold">{kitCount}</span><span className="text-zinc-400"> {kitCount === 1 ? 'lens' : 'lenses'} selected</span></span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {kitCount > 0 && (
            <button onClick={() => setKit(new Map())} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear all</button>
          )}
          <button onClick={handleSave} disabled={kitCount === 0} className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${kitCount > 0 ? 'bg-orange-400 text-black hover:bg-orange-300' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
            Save to list
          </button>
        </div>
      </div>
    </div>
  )
}
