'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [lists, setLists] = useState<any[]>([])
  const [shares, setShares] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState('active')
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('kitlist-theme')
    if (stored === 'light') { setDarkMode(false); document.documentElement.classList.remove('dark') }
    else { setDarkMode(true); document.documentElement.classList.add('dark') }
    loadData()
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('kitlist-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile?.full_name) setUser((u: any) => ({ ...u, full_name: profile.full_name }))
    const { data: ls } = await supabase
      .from('gear_lists')
      .select('*, rental_houses(name), camera_pages(id), shoot_specs(format, resolution)')
      .order('created_at', { ascending: false })
    if (ls) setLists(ls)
    const { data: sh } = await supabase.from('list_shares').select('list_id')
    if (sh) {
      const counts: Record<string, number> = {}
      sh.forEach((s: any) => { counts[s.list_id] = (counts[s.list_id] || 0) + 1 })
      setShares(counts)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('gear_lists').update({ status }).eq('id', id)
    setLists(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const deleteList = async (id: string) => {
    if (!confirm('Delete this list? This cannot be undone.')) return
    await supabase.from('gear_lists').delete().eq('id', id)
    setLists(prev => prev.filter(l => l.id !== id))
  }

  const copyList = async (list: any) => {
    const { data: newList } = await supabase.from('gear_lists').insert({
      owner_id: list.owner_id,
      project_name: list.project_name + ' (copy)',
      production_co: list.production_co,
      house_id: list.house_id,
      shoot_days: list.shoot_days,
      status: 'draft'
    }).select().single()
    if (newList) {
      const { data: cameras } = await supabase.from('camera_pages').select('*').eq('list_id', list.id)
      if (cameras && cameras.length > 0) {
        for (const cam of cameras) {
          const { data: newCam } = await supabase.from('camera_pages').insert({
            list_id: newList.id, label: cam.label, sort_order: cam.sort_order,
            camera_body_id: cam.camera_body_id, camera_body_source: cam.camera_body_source,
            camera_notes: cam.camera_notes, camera_format: cam.camera_format
          }).select().single()
          if (newCam) {
            const { data: items } = await supabase.from('camera_page_items').select('*').eq('page_id', cam.id)
            if (items && items.length > 0) {
              await supabase.from('camera_page_items').insert(items.map((i: any) => ({
                page_id: newCam.id, section: i.section, item_id: i.item_id,
                custom_label: i.custom_label, source: i.source, quantity: i.quantity
              })))
            }
          }
        }
      }
      const { data: lenses } = await supabase.from('list_lenses').select('*, list_lens_zooms(*)').eq('list_id', list.id).maybeSingle()
      if (lenses) {
        const { data: newLenses } = await supabase.from('list_lenses').insert({
          list_id: newList.id, prime_set_id: lenses.prime_set_id,
          focal_lengths: lenses.focal_lengths, zoom_controller: lenses.zoom_controller, source: lenses.source
        }).select().single()
        if (newLenses && lenses.list_lens_zooms?.length > 0) {
          await supabase.from('list_lens_zooms').insert(lenses.list_lens_zooms.map((z: any) => ({
            list_lens_id: newLenses.id, item_id: z.item_id, source: z.source
          })))
        }
      }
      const { data: misc } = await supabase.from('list_misc_items').select('*').eq('list_id', list.id)
      if (misc && misc.length > 0) {
        await supabase.from('list_misc_items').insert(misc.map((i: any) => ({
          list_id: newList.id, item_id: i.item_id, custom_label: i.custom_label, source: i.source, notes: i.notes
        })))
      }
      const { data: specs } = await supabase.from('shoot_specs').select('*').eq('list_id', list.id).maybeSingle()
      if (specs) {
        await supabase.from('shoot_specs').insert({
          list_id: newList.id, format: specs.format, resolution: specs.resolution,
          fps: specs.fps, lut: specs.lut, aspect_ratio: specs.aspect_ratio, job_notes: specs.job_notes
        })
      }
      router.push('/lists/' + newList.id)
    }
  }

  const filtered = lists.filter(l => {
    if (tab === 'active') return ['draft', 'sent', 'confirmed'].includes(l.status)
    if (tab === 'archived') return l.status === 'archived'
    return l.status === tab
  })

  const statusColor = (s: string) => {
    if (s === 'confirmed') return 'bg-green-900 text-green-400'
    if (s === 'sent') return 'bg-blue-900 text-blue-400'
    if (s === 'archived') return 'bg-zinc-800 text-zinc-600'
    return 'bg-zinc-800 text-zinc-400'
  }

  const tabs = [
    { key: 'active', label: 'Active', count: lists.filter(l => ['draft','sent','confirmed'].includes(l.status)).length },
    { key: 'draft', label: 'Draft', count: lists.filter(l => l.status === 'draft').length },
    { key: 'sent', label: 'Sent', count: lists.filter(l => l.status === 'sent').length },
    { key: 'confirmed', label: 'Confirmed', count: lists.filter(l => l.status === 'confirmed').length },
    { key: 'archived', label: 'Archived', count: lists.filter(l => l.status === 'archived').length },
  ]

  return (
    <div className={`min-h-screen ${ darkMode ? 'bg-black text-white' : 'bg-gray-50 text-zinc-900' }`}>
      <nav className={`border-b ${ darkMode ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white' } px-6 py-4 flex items-center justify-between`}>
        <h1 className="text-xl font-bold">Kit<span className="text-orange-400">List</span></h1>
        <div className="flex items-center gap-4">
          <a href="/profile" className={`text-sm transition-colors ${ darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900' }`}>
            {user?.full_name || user?.email}
          </a>
          <button onClick={toggleTheme}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${ darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-gray-100 hover:bg-gray-200 text-zinc-600' }`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <a href="/auth/signout" className={`text-sm transition-colors ${ darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900' }`}>Sign out</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">My Gear Lists</h2>
            <p className={`text-sm mt-1 ${ darkMode ? 'text-zinc-500' : 'text-zinc-500' }`}>Create and manage your camera equipment lists</p>
          </div>
          <a href="/lists/new" className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">+ New List</a>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-2 px-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${ tab === t.key ? 'bg-orange-400 text-black' : darkMode ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-white text-zinc-500 hover:bg-gray-100 border border-gray-200' }`}>
              {t.label}
              {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${ tab === t.key ? 'bg-black/20 text-black' : darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-100 text-zinc-400' }`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><p className={darkMode ? 'text-zinc-600' : 'text-zinc-400'}>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className={`border border-dashed rounded-2xl p-16 text-center ${ darkMode ? 'border-zinc-700' : 'border-gray-300' }`}>
            <p className={`text-lg mb-2 ${ darkMode ? 'text-zinc-400' : 'text-zinc-500' }`}>No lists here</p>
            {tab === 'active' && <a href="/lists/new" className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-3 rounded-lg text-sm inline-block mt-4">Create your first list</a>}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((list: any) => {
              const camCount = list.camera_pages?.length || 0
              const specs = list.shoot_specs?.[0]
              const shareCount = shares[list.id] || 0
              return (
                <div key={list.id} className={`rounded-xl border transition-colors ${ darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-gray-200 hover:border-gray-300' }`}>
                  <a href={`/lists/${list.id}`} className="block p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{list.project_name}</h3>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor(list.status)}`}>{list.status}</span>
                          {shareCount > 0 && (
                            <span className="text-xs bg-orange-950 text-orange-400 px-2.5 py-0.5 rounded-full font-medium">{shareCount} shared</span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${ darkMode ? 'text-zinc-500' : 'text-zinc-500' }`}>{list.production_co}</p>
                        <div className={`flex gap-3 mt-2 text-xs flex-wrap ${ darkMode ? 'text-zinc-600' : 'text-zinc-400' }`}>
                          {list.shoot_start && <span>{new Date(list.shoot_start).toLocaleDateString('en-AU')}</span>}
                          {list.shoot_days && <span>{list.shoot_days} days</span>}
                          {camCount > 0 && <span>{camCount} camera{camCount !== 1 ? 's' : ''}</span>}
                          {list.rental_houses?.name && <span>{list.rental_houses.name}</span>}
                          {specs && <span>{[specs.format, specs.resolution].filter(Boolean).join(' · ')}</span>}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={darkMode ? 'text-zinc-700 mt-1' : 'text-gray-300 mt-1'}>
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </a>
                  <div className={`px-5 pb-4 flex gap-2 border-t ${ darkMode ? 'border-zinc-800' : 'border-gray-100' }`}>
                    <div className="flex gap-1 pt-3 flex-wrap">
                      {list.status === 'draft' && <button onClick={() => updateStatus(list.id, 'sent')} className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded-lg transition-colors">Mark sent</button>}
                      {list.status === 'sent' && <button onClick={() => updateStatus(list.id, 'confirmed')} className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg transition-colors">Mark confirmed</button>}
                      {list.status !== 'archived' && <button onClick={() => updateStatus(list.id, 'archived')} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${ darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-gray-100 hover:bg-gray-200 text-zinc-500' }`}>Archive</button>}
                      {list.status === 'archived' && <button onClick={() => updateStatus(list.id, 'draft')} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${ darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-gray-100 hover:bg-gray-200 text-zinc-500' }`}>Restore</button>}
                      <button onClick={() => copyList(list)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${ darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-gray-100 hover:bg-gray-200 text-zinc-500' }`}>Copy to new job</button>
                      <button onClick={() => deleteList(list.id)} className="text-xs bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}