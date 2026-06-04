'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Lens { id: string; manufacturer: string; category: string | null; sub_category: string | null; lens_name: string }

export default function LensesV2() {
  const supabase = createClient()
  const [allLenses, setAllLenses] = useState<Lens[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selMfr, setSelMfr] = useState<string | null>(null)
  const [selCat, setSelCat] = useState<string | null>(null)
  const [selSubCat, setSelSubCat] = useState<string | null>(null)
  const [added, setAdded] = useState<{lens: Lens, source: string}[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      let all: Lens[] = []
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
      setLoading(false)
    }
    fetchAll()
  }, [])

  const searchResults = search.trim().length > 1
    ? allLenses.filter(l =>
        l.lens_name.toLowerCase().includes(search.toLowerCase()) ||
        l.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
        (l.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.sub_category || '').toLowerCase().includes(search.toLowerCase())
      )
    : []

  const manufacturers = [...new Set(allLenses.map(l => l.manufacturer))].sort()

  const mfrLenses = selMfr ? allLenses.filter(l => l.manufacturer === selMfr) : []
  const categories = [...new Set(mfrLenses.filter(l => l.category).map(l => l.category as string))].sort()

  const catLenses = selCat ? mfrLenses.filter(l => l.category === selCat) : mfrLenses
  const subCategories = [...new Set(catLenses.filter(l => l.sub_category).map(l => l.sub_category as string))].sort()
  const hasSubCats = subCategories.length > 0

  const finalLenses = hasSubCats && selSubCat
    ? catLenses.filter(l => l.sub_category === selSubCat)
    : !hasSubCats && selCat
      ? catLenses
      : []

  const showLensCol = (!hasSubCats && selCat) || (hasSubCats && selSubCat)

  const isAdded = (lens: Lens) => added.some(a => a.lens.id === lens.id)
  const addLens = (lens: Lens) => { if (!isAdded(lens)) setAdded(prev => [...prev, { lens, source: 'rental' }]) }
  const removeAdded = (id: string) => setAdded(prev => prev.filter(a => a.lens.id !== id))
  const updateSource = (id: string, source: string) => setAdded(prev => prev.map(a => a.lens.id === id ? { ...a, source } : a))

  const groupedAdded = added.reduce((acc: Record<string, typeof added>, a) => {
    const m = a.lens.manufacturer
    if (!acc[m]) acc[m] = []
    acc[m].push(a)
    return acc
  }, {})

  const colClass = "border-r border-zinc-800 overflow-y-auto flex flex-col min-w-0"
  const headerClass = "px-3 py-2 text-xs text-zinc-600 uppercase tracking-widest bg-zinc-950 border-b border-zinc-800 flex-shrink-0 sticky top-0"
  const itemClass = (active: boolean) => `px-3 py-2.5 text-sm cursor-pointer border-b border-zinc-900 flex items-center justify-between transition-colors flex-shrink-0 ${active ? 'bg-zinc-800 text-[#FFE135]' : 'text-zinc-300 hover:bg-zinc-900'}`
  const emptyClass = "text-zinc-700 text-xs px-3 py-3"

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">v2 preview</span>
          <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold">Lenses</h2>
          <span className="text-xs text-zinc-600">{loading ? 'Loading...' : `${allLenses.length.toLocaleString()} lenses · ${manufacturers.length} manufacturers`}</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input type="text" value={search}
            onChange={e => { setSearch(e.target.value); setSelMfr(null); setSelCat(null); setSelSubCat(null) }}
            placeholder="Search any lens, e.g. Master Prime, Cooke S4, Signature Zoom..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] pr-10"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-zinc-500 hover:text-white text-lg">×</button>}
        </div>

        {/* Search results */}
        {search.trim().length > 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-4 max-h-72 overflow-y-auto">
            {searchResults.length === 0
              ? <p className="text-zinc-500 text-sm px-4 py-3">No results</p>
              : searchResults.map(l => (
                <div key={l.id} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <div>
                    <p className="text-sm text-white">{l.lens_name}</p>
                    <p className="text-xs text-zinc-500">{l.manufacturer}{l.category ? ` · ${l.category}` : ''}{l.sub_category ? ` · ${l.sub_category}` : ''}</p>
                  </div>
                  <button onClick={() => addLens(l)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-3 ${isAdded(l) ? 'bg-zinc-700 text-zinc-400' : 'bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold'}`}>
                    {isAdded(l) ? 'Added' : '+ Add'}
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {/* Miller columns */}
        {!search.trim() && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-4" style={{height: '420px'}}>
            <div className="flex h-full">

              {/* Col 1: Manufacturer */}
              <div className={colClass} style={{width: '22%'}}>
                <div className={headerClass}>Manufacturer</div>
                {loading
                  ? <p className={emptyClass}>Loading...</p>
                  : manufacturers.map(m => (
                    <div key={m} className={itemClass(selMfr === m)} onClick={() => { setSelMfr(m); setSelCat(null); setSelSubCat(null) }}>
                      <span className="truncate">{m}</span>
                      <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  ))
                }
              </div>

              {/* Col 2: Category */}
              <div className={colClass} style={{width: '22%'}}>
                <div className={headerClass}>Category</div>
                {!selMfr
                  ? <p className={emptyClass}>← select manufacturer</p>
                  : categories.length === 0
                    ? <p className={emptyClass}>No categories</p>
                    : categories.map(c => (
                        <div key={c} className={itemClass(selCat === c)} onClick={() => { setSelCat(c); setSelSubCat(null) }}>
                          <span className="truncate">{c}</span>
                          <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </div>
                      ))
                }
              </div>

              {/* Col 3: Sub category (only if exists) or Lens */}
              {hasSubCats ? (
                <div className={colClass} style={{width: '22%'}}>
                  <div className={headerClass}>Sub category</div>
                  {!selCat
                    ? <p className={emptyClass}>← select category</p>
                    : subCategories.map(s => (
                        <div key={s} className={itemClass(selSubCat === s)} onClick={() => setSelSubCat(s)}>
                          <span className="truncate">{s}</span>
                          <svg className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </div>
                      ))
                  }
                </div>
              ) : null}

              {/* Col 4 (or 3): Lens */}
              <div className={`flex-1 overflow-y-auto flex flex-col min-w-0`}>
                <div className={headerClass}>Lens</div>
                {!showLensCol
                  ? <p className={emptyClass}>{hasSubCats ? '← select sub category' : selMfr ? '← select category' : '← select manufacturer'}</p>
                  : finalLenses.length === 0
                    ? <p className={emptyClass}>No lenses found</p>
                    : finalLenses.map(l => (
                        <div key={l.id}
                          className={`px-3 py-2.5 text-sm border-b border-zinc-900 flex items-center justify-between transition-colors flex-shrink-0 ${isAdded(l) ? 'text-zinc-500 cursor-default' : 'text-zinc-300 hover:bg-zinc-900 cursor-pointer'}`}
                          onClick={() => !isAdded(l) && addLens(l)}>
                          <span className="truncate">{l.lens_name}</span>
                          {isAdded(l)
                            ? <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">✓</span>
                            : <span className="text-xs text-[#FFE135] flex-shrink-0 ml-2">+</span>
                          }
                        </div>
                      ))
                }
              </div>

            </div>
          </div>
        )}

        {/* Added lenses */}
        {added.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Added to kit — {added.length} lens{added.length !== 1 ? 'es' : ''}</h3>
              <button onClick={() => setAdded([])} className="text-xs text-zinc-600 hover:text-zinc-400">Clear all</button>
            </div>
            {Object.entries(groupedAdded).map(([mfr, items]) => (
              <div key={mfr} className="mb-4">
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">{mfr}</p>
                {items.map(({ lens, source }) => (
                  <div key={lens.id} className="flex items-center justify-between py-2.5 border-b border-zinc-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{lens.lens_name}</p>
                      {(lens.category || lens.sub_category) && (
                        <p className="text-xs text-zinc-600">{lens.category}{lens.sub_category ? ` · ${lens.sub_category}` : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mx-3 flex-shrink-0">
                      {['rental', 'dop_owned', 'ac_owned'].map(s => (
                        <button key={s} onClick={() => updateSource(lens.id, s)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${source === s ? (s === 'rental' ? 'bg-zinc-600 text-white' : s === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-blue-500 text-white') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                          {s === 'rental' ? 'Rental' : s === 'dop_owned' ? 'DOP' : 'AC'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeAdded(lens.id)} className="text-zinc-600 hover:text-red-400 text-lg flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-6 py-2.5 rounded-lg text-sm">
                Save lenses
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
