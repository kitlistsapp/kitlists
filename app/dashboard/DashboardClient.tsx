'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardClient({ user, initialLists, initialShares, collaboratedLists }: {
  user: any
  initialLists: any[]
  initialShares: Record<string, number>
  collaboratedLists: any[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [lists, setLists] = useState(initialLists)
  const [shares] = useState(initialShares)
  const [tab, setTab] = useState('active')


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

  const bg = 'bg-black text-white'
  const navBg = 'border-zinc-800 bg-black'
  const cardBg = 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
  const tabActive = 'bg-[#FFE135] text-black'
  const tabInactive = 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
  const mutedText = 'text-zinc-500'
  const dimText = 'text-zinc-600'

  return (
    <div className={"min-h-screen flex flex-col " + bg}>
      <nav className={"border-b px-4 py-4 flex items-center justify-between " + navBg}>
        <h1 className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></h1>
        <div className="flex items-center gap-3">
          <a href="/profile" className="flex items-center gap-2 group">
            {user?.logo_url && (
              <img src={user.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-zinc-800 p-0.5 border border-zinc-700" />
            )}
            <div className="text-right hidden sm:block">
              {user?.full_name && <p className={"text-sm font-medium transition-colors " + ('text-zinc-300 group-hover:text-white')}>{user.full_name}</p>}
              {user?.company_name && <p className={"text-xs transition-colors " + ('text-zinc-500 group-hover:text-zinc-400')}>{user.company_name}</p>}
            </div>
            {!user?.full_name && <span className={"text-sm transition-colors " + ('text-zinc-400 hover:text-white')}>My Profile</span>}
          </a>

          <a href="/auth/signout" className={"text-sm transition-colors " + ('text-zinc-400 hover:text-white')}>Sign out</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">My Gear Lists</h2>
            <p className={"text-sm mt-0.5 " + mutedText}>Create and manage your camera equipment lists</p>
          </div>
          <a href="/lists/new" className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">+ New List</a>
        </div>

        <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={"px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap sm:px-3 sm:py-2 sm:text-sm sm:gap-1.5 " + (tab === t.key ? tabActive : tabInactive)}>
              {t.label}
              {t.count > 0 && <span className={"text-xs px-1.5 py-0.5 rounded-full " + (tab === t.key ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-500')}>{t.count}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={"border border-dashed rounded-2xl p-16 text-center " + ('border-zinc-700')}>
            <p className={"text-lg mb-2 " + mutedText}>No lists here</p>
            {tab === 'active' && <a href="/lists/new" className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg text-sm inline-block mt-4">Create your first list</a>}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((list: any) => {
              const camCount = list.camera_pages?.length || 0
              const specs = list.shoot_specs?.[0]
              const shareCount = shares[list.id] || 0
              return (
                <div key={list.id} className={"rounded-xl border transition-colors " + cardBg}>
                  <a href={"/lists/" + list.id} className="block p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{list.project_name}</h3>
                          <span className={"text-xs px-2.5 py-0.5 rounded-full font-medium " + statusColor(list.status)}>{list.status}</span>
                          {shareCount > 0 && <span className="text-xs bg-[#2a1f00] text-[#FFE135] px-2.5 py-0.5 rounded-full font-medium">{shareCount} shared</span>}
                        </div>
                        <p className={"text-sm mt-0.5 " + mutedText}>{list.production_co}</p>
                        <div className={"flex gap-3 mt-1.5 text-xs flex-wrap " + dimText}>
                          {list.shoot_start && <span>{new Date(list.shoot_start).toLocaleDateString('en-AU')}</span>}
                          {list.shoot_days && <span>{list.shoot_days} days</span>}
                          {camCount > 0 && <span>{camCount} camera{camCount !== 1 ? 's' : ''}</span>}
                          {list.rental_houses?.name && <span>{list.rental_houses.name}</span>}
                          {specs && <span>{[specs.format, specs.resolution].filter(Boolean).join(' · ')}</span>}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={'text-zinc-700 mt-1'}>
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </a>
                  <div className={"px-4 pb-3 flex gap-1.5 border-t flex-wrap pt-3 " + ('border-zinc-800')}>
                    {list.status === 'draft' && <button onClick={() => updateStatus(list.id, 'sent')} className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded-lg transition-colors">Mark sent</button>}
                    {list.status === 'sent' && <button onClick={() => updateStatus(list.id, 'confirmed')} className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg transition-colors">Mark confirmed</button>}
                    {list.status !== 'archived' && <button onClick={() => updateStatus(list.id, 'archived')} className={"text-xs px-3 py-1.5 rounded-lg transition-colors " + ('bg-zinc-800 hover:bg-zinc-700 text-zinc-400')}>Archive</button>}
                    {list.status === 'archived' && <button onClick={() => updateStatus(list.id, 'draft')} className={"text-xs px-3 py-1.5 rounded-lg transition-colors " + ('bg-zinc-800 hover:bg-zinc-700 text-zinc-400')}>Restore</button>}
                    <button onClick={() => copyList(list)} className={"text-xs px-3 py-1.5 rounded-lg transition-colors " + ('bg-zinc-800 hover:bg-zinc-700 text-zinc-400')}>Copy to new job</button>
                    <button onClick={() => deleteList(list.id)} className="text-xs bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* Shared with me */}
        {collaboratedLists && collaboratedLists.length > 0 && (
          <div className="mt-10">
            <h3 className={"text-sm font-semibold uppercase tracking-widest mb-3 " + mutedText}>Shared with me</h3>
            <div className="grid gap-3">
              {collaboratedLists.map((list: any) => (
                <div key={list.id} className={"rounded-xl border transition-colors " + cardBg}>
                  <a href={"/lists/" + list.id} className="block p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{list.project_name}</h3>
                          <span className="text-xs bg-blue-950 text-blue-400 px-2.5 py-0.5 rounded-full font-medium">Collaborating</span>
                        </div>
                        <p className={"text-sm mt-0.5 " + mutedText}>{list.production_co}</p>
                        <div className={"flex gap-3 mt-1.5 text-xs flex-wrap " + dimText}>
                          {list.shoot_start && <span>{new Date(list.shoot_start).toLocaleDateString('en-AU')}</span>}
                          {list.shoot_days && <span>{list.shoot_days} days</span>}
                          {list._invitedBy?.full_name && <span>DOP: {list._invitedBy.full_name}</span>}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={'text-zinc-700 mt-1'}>
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  )
}
