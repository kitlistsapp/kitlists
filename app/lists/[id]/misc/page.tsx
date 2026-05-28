'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Item { id: string; name: string; brand: string | null; subcategory: string | null; category: string }

export default function MiscPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [miscItems, setMiscItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [miscSource, setMiscSource] = useState<Record<string, string>>({})
  const [customItem, setCustomItem] = useState('')

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const [{ data: eq }, { data: existing }] = await Promise.all([
      supabase.from('equipment_items').select('*').eq('category', 'misc').order('name'),
      supabase.from('list_misc_items').select('*, equipment_items(name, brand)').eq('list_id', lid)
    ])
    if (eq) setMiscItems(eq)
    if (existing && existing.length > 0) {
      setSelected(existing.filter((i: any) => i.item_id).map((i: any) => i.item_id))
      const noteMap: Record<string, string> = {}
      const sourceMap: Record<string, string> = {}
      existing.forEach((i: any) => {
        if (i.item_id) {
          if (i.notes) noteMap[i.item_id] = i.notes
          sourceMap[i.item_id] = i.source || 'rental'
        }
      })
      setNotes(noteMap)
      setMiscSource(sourceMap)
    }
  }

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    if (!miscSource[id]) setMiscSource(prev => ({ ...prev, [id]: 'rental' }))
  }

  const addCustom = () => {
    if (!customItem.trim()) return
    const tempId = 'custom:' + customItem.trim()
    setMiscItems(prev => [...prev, { id: tempId, name: customItem.trim(), brand: null, subcategory: null, category: 'misc' }])
    setSelected(prev => [...prev, tempId])
    setMiscSource(prev => ({ ...prev, [tempId]: 'rental' }))
    setCustomItem('')
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('list_misc_items').delete().eq('list_id', listId)
    const rows = selected.map(id => ({
      list_id: listId,
      item_id: id.startsWith('custom:') ? null : id,
      custom_label: id.startsWith('custom:') ? id.slice(7) : null,
      source: miscSource[id] || 'rental',
      notes: notes[id] || null
    }))
    if (rows.length > 0) await supabase.from('list_misc_items').insert(rows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-2">Misc AKS</h2>
        <p className="text-zinc-500 text-sm mb-8">Additional accessories for the whole package</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="space-y-1 mb-6">
            {miscItems.map(item => (
              <div key={item.id}>
                <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${ selected.includes(item.id) ? 'bg-[#FFE135] border-[#FFE135]' : 'border-zinc-600 group-hover:border-zinc-400' }`}
                    onClick={() => toggle(item.id)}
                  >
                    {selected.includes(item.id) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div onClick={() => toggle(item.id)} className="flex-1">
                    <span className="text-sm text-zinc-200">{item.name}</span>
                    {item.brand && <span className="text-xs text-zinc-600 ml-2">{item.brand}</span>}
                  </div>
                </label>
                {selected.includes(item.id) && (
                  <div className="ml-12 mt-1 mb-2 flex gap-2 items-start">
                    <div className="flex gap-1">
                      <button onClick={() => setMiscSource(prev => ({ ...prev, [item.id]: 'rental' }))}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${ (miscSource[item.id] || 'rental') === 'rental' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>
                        Rental
                      </button>
                      <button onClick={() => setMiscSource(prev => ({ ...prev, [item.id]: 'dop_owned' }))}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${ miscSource[item.id] === 'dop_owned' ? 'bg-[#FFE135] text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' }`}>
                        DOP owned
                      </button>
                    </div>
                    <input
                      type="text"
                      value={notes[item.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Notes (e.g. qty, spec)"
                      className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded px-3 py-1 text-xs focus:outline-none focus:border-[#FFE135]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Add custom item</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={customItem}
                onChange={e => setCustomItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="e.g. Scorpio Remote Head"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE135]"
              />
              <button onClick={addCustom} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2.5 rounded-lg text-sm transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}