'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; lens_brand: string | null; subcategory: string | null; category: string }

const SUBCATEGORY_LABELS: Record<string, string> = {
  large_format: 'Large Format',
  super_35: 'Super 35',
  specialty: 'Specialty / Probe',
  vintage: 'Vintage',
}

interface SelectedLens { id: string; name: string; brand: string; source: 'rental' | 'dop_owned' }

export default function LensesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lensRecordId, setLensRecordId] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<Item[]>([])

  const [selectedLenses, setSelectedLenses] = useState<SelectedLens[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [lensSearch, setLensSearch] = useState('')
  const [selectedFocalLengths, setSelectedFocalLengths] = useState<string[]>([])
  const [selectedZooms, setSelectedZoom] = useState<SelectedLens[]>([])
  const [selectedZoomBrand, setSelectedZoomBrand] = useState('')
  const [selectedController, setSelectedController] = useState('')
  const [controllerSearch, setControllerSearch] = useState('')
  const [controllerOpen, setControllerOpen] = useState(false)
  const controllerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (controllerRef.current && !controllerRef.current.contains(e.target as Node)) setControllerOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').order('name'),
      supabase.from('list_lenses').select('*, equipment_items(name, lens_brand), list_lens_zooms(*, equipment_items(name, lens_brand))').eq('list_id', lid).maybeSingle()
    ])
    if (eq) setAllItems(eq)
    if (existing) {
      setLensRecordId(existing.id)
      if (existing.focal_lengths) {
        const focalItems = (eq || []).filter((i: Item) => i.category === 'focal_length')
        const ids = existing.focal_lengths.map((name: string) => focalItems.find((i: Item) => i.name === name)?.id).filter(Boolean)
        setSelectedFocalLengths(ids)
      }
      if (existing.zoom_controller) setSelectedController(existing.zoom_controller)
      if (existing.list_lens_zooms) {
        setSelectedZoom(existing.list_lens_zooms.map((z: any) => ({
          id: z.item_id,
          name: z.equipment_items?.name || '',
          brand: z.equipment_items?.lens_brand || '',
          source: z.source || 'rental'
        })))
      }
    }
  }

  const brands = [...new Set(allItems.filter(i => i.category === 'prime_set').map(i => i.lens_brand || 'Other'))].sort()
  const zoomBrands = [...new Set(allItems.filter(i => i.category === 'zoom').map(i => i.lens_brand || 'Other'))].sort()
  const focalLengths = allItems.filter(i => i.category === 'focal_length').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
  const controllers = allItems.filter(i => i.category === 'controller')

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
  const lensesForBrand = allItems.filter(i => i.category === 'prime_set' && i.lens_brand === selectedBrand)
  const filteredLenses = lensesForBrand.filter(l => l.name.toLowerCase().includes(lensSearch.toLowerCase()))

  const zoomLensesForBrand = allItems.filter(i => i.category === 'zoom' && i.lens_brand === selectedZoomBrand)

  const groupedLenses = filteredLenses.reduce((acc: Record<string, Item[]>, item) => {
    const key = SUBCATEGORY_LABELS[item.subcategory || ''] || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const addLens = (item: Item) => {
    if (selectedLenses.find(l => l.id === item.id)) return
    setSelectedLenses(prev => [...prev, { id: item.id, name: item.name, brand: item.lens_brand || '', source: 'rental' }])
  }

  const removeLens = (id: string) => setSelectedLenses(prev => prev.filter(l => l.id !== id))
  const toggleLensSource = (id: string) => setSelectedLenses(prev => prev.map(l => l.id === id ? { ...l, source: l.source === 'rental' ? 'dop_owned' : 'rental' } : l))

  const addZoom = (item: Item) => {
    if (selectedZooms.find(z => z.id === item.id)) return
    setSelectedZoom(prev => [...prev, { id: item.id, name: item.name, brand: item.lens_brand || '', source: 'rental' }])
  }
  const removeZoom = (id: string) => setSelectedZoom(prev => prev.filter(z => z.id !== id))

  const save = async () => {
    setSaving(true)
    const focalNames = selectedFocalLengths.map(id => focalLengths.find(f => f.id === id)?.name || id)
    const payload = {
      list_id: listId,
      prime_set_id: selectedLenses[0]?.id || null,
      focal_lengths: focalNames,
      zoom_controller: selectedController,
      source: selectedLenses[0]?.source || 'rental'
    }
    if (lensRecordId) {
      await supabase.from('list_lenses').update(payload).eq('id', lensRecordId)
      await supabase.from('list_lens_zooms').delete().eq('list_lens_id', lensRecordId)
      if (selectedZooms.length > 0) await supabase.from('list_lens_zooms').insert(selectedZooms.map(z => ({ list_lens_id: lensRecordId, item_id: z.id, source: z.source })))
    } else {
      const { data: newRec } = await supabase.from('list_lenses').insert(payload).select().single()
      if (newRec) {
        setLensRecordId(newRec.id)
        if (selectedZooms.length > 0) await supabase.from('list_lens_zooms').insert(selectedZooms.map(z => ({ list_lens_id: newRec.id, item_id: z.id, source: z.source })))
      }
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const filteredControllers = controllers.filter(c => c.name.toLowerCase().includes(controllerSearch.toLowerCase()))
  const selectedControllerName = controllers.find(c => c.id === selectedController)?.name || selectedController

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Lenses</h2>
        <p className="text-zinc-500 text-sm mb-8">Shared across all cameras on this list</p>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Prime lenses</h3>

            {selectedLenses.length > 0 && (
              <div className="mb-4 space-y-2">
                {selectedLenses.map(lens => (
                  <div key={lens.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{lens.name}</p>
                      <p className="text-zinc-500 text-xs">{lens.brand}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLensSource(lens.id)} className={`text-xs px-2.5 py-1 rounded-full transition-colors ${ lens.source === 'dop_owned' ? 'bg-orange-400 text-black' : 'bg-zinc-700 text-zinc-300' }`}>{lens.source === 'dop_owned' ? 'DOP owned' : 'Rental'}</button>
                      <button onClick={() => removeLens(lens.id)} className="text-zinc-600 hover:text-red-400 text-lg transition-colors">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 text-xs mb-2">1. Select brand</p>
                <input type="text" value={brandSearch} onChange={e => setBrandSearch(e.target.value)} placeholder="Search brands..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 mb-2" />
                <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {filteredBrands.map(brand => (
                    <button key={brand} onClick={() => { setSelectedBrand(brand); setLensSearch('') }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-800 last:border-0 ${ selectedBrand === brand ? 'bg-orange-400 text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800' }`}>
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-2">2. Select lens {selectedBrand && `— ${selectedBrand}`}</p>
                {selectedBrand ? (
                  <>
                    <input type="text" value={lensSearch} onChange={e => setLensSearch(e.target.value)} placeholder="Search lenses..."
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 mb-2" />
                    <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      {Object.entries(groupedLenses).map(([subcat, items]) => (
                        <div key={subcat}>
                          {Object.keys(groupedLenses).length > 1 && (
                            <div className="px-4 py-1.5 text-xs text-zinc-600 uppercase tracking-widest bg-zinc-950">{subcat}</div>
                          )}
                          {items.map(item => (
                            <button key={item.id} onClick={() => addLens(item)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-800 last:border-0 ${ selectedLenses.find(l => l.id === item.id) ? 'bg-zinc-700 text-zinc-400' : 'text-zinc-300 hover:bg-zinc-800' }`}>
                              {item.name}
                              {selectedLenses.find(l => l.id === item.id) && <span className="text-orange-400 ml-2 text-xs">✓</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                      {filteredLenses.length === 0 && <p className="text-zinc-600 text-sm px-4 py-3">No lenses found</p>}
                    </div>
                  </>
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-xl h-32 flex items-center justify-center">
                    <p className="text-zinc-600 text-sm">Select a brand first</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Focal lengths</h3>
            <div className="flex flex-wrap gap-2">
              {focalLengths.map(fl => (
                <button key={fl.id} onClick={() => setSelectedFocalLengths(prev => prev.includes(fl.id) ? prev.filter(x => x !== fl.id) : [...prev, fl.id])}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${ selectedFocalLengths.includes(fl.id) ? 'bg-orange-400 border-orange-400 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500' }`}>
                  {fl.name}
                </button>
              ))}
            </div>
            {selectedFocalLengths.length > 0 && <p className="text-zinc-600 text-xs mt-3">{selectedFocalLengths.length} selected</p>}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Zoom lenses</h3>

            {selectedZooms.length > 0 && (
              <div className="mb-4 space-y-2">
                {selectedZooms.map(zoom => (
                  <div key={zoom.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{zoom.name}</p>
                      <p className="text-zinc-500 text-xs">{zoom.brand}</p>
                    </div>
                    <button onClick={() => removeZoom(zoom.id)} className="text-zinc-600 hover:text-red-400 text-lg transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 text-xs mb-2">1. Select brand</p>
                <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {zoomBrands.map(brand => (
                    <button key={brand} onClick={() => setSelectedZoomBrand(brand)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-800 last:border-0 ${ selectedZoomBrand === brand ? 'bg-orange-400 text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800' }`}>
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-2">2. Select zoom {selectedZoomBrand && `— ${selectedZoomBrand}`}</p>
                {selectedZoomBrand ? (
                  <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {zoomLensesForBrand.map(item => (
                      <button key={item.id} onClick={() => addZoom(item)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-800 last:border-0 ${ selectedZooms.find(z => z.id === item.id) ? 'bg-zinc-700 text-zinc-400' : 'text-zinc-300 hover:bg-zinc-800' }`}>
                        {item.name}
                        {selectedZooms.find(z => z.id === item.id) && <span className="text-orange-400 ml-2 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-xl h-24 flex items-center justify-center">
                    <p className="text-zinc-600 text-sm">Select a brand first</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Zoom / focus controller</h3>
            <div ref={controllerRef} className="relative">
              <input type="text" value={controllerSearch || selectedControllerName} onFocus={() => { setControllerOpen(true); setControllerSearch('') }} onChange={e => { setControllerSearch(e.target.value); setControllerOpen(true) }}
                placeholder="Search controllers..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
              {selectedController && (
                <button onClick={() => { setSelectedController(''); setControllerSearch('') }} className="absolute right-3 top-3.5 text-xs text-zinc-500 hover:text-zinc-300">clear</button>
              )}
              {controllerOpen && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredControllers.map(c => (
                    <button key={c.id} onClick={() => { setSelectedController(c.id); setControllerOpen(false); setControllerSearch('') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800">
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}