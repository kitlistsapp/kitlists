'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SaveAsTemplate({ listId }: { listId: string }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [name, setName] = useState('')

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: list } = await supabase.from('gear_lists').select('*').eq('id', listId).single()
    const { data: cameras } = await supabase.from('camera_pages').select('*').eq('list_id', listId)
    const camData = await Promise.all((cameras || []).map(async (cam: any) => {
      const { data: items } = await supabase.from('camera_page_items').select('*').eq('page_id', cam.id)
      return { ...cam, items: items || [] }
    }))
    const { data: lenses } = await supabase.from('list_lenses').select('*, list_lens_zooms(*)').eq('list_id', listId).maybeSingle()
    const { data: misc } = await supabase.from('list_misc_items').select('*').eq('list_id', listId)
    const { data: specs } = await supabase.from('shoot_specs').select('*').eq('list_id', listId).maybeSingle()

    const snapshot = { list, cameras: camData, lenses, misc, specs }

    const { error } = await supabase.from('templates').insert({
      owner_id: user.id,
      house_id: list?.house_id || null,
      name: name.trim(),
      snapshot
    })
    if (error) { console.log('Template save error:', error); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setShowInput(false)
    setName('')
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) return <span className="text-green-400 text-sm">Saved as template</span>

  if (showInput) return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="Template name..."
        autoFocus
        className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#FFE135] w-40"
      />
      <button onClick={save} disabled={saving || !name.trim()}
        className="text-sm bg-[#FFE135] hover:bg-[#FFD700] text-black font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">
        {saving ? '...' : 'Save'}
      </button>
      <button onClick={() => setShowInput(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">Cancel</button>
    </div>
  )

  return (
    <button onClick={() => setShowInput(true)}
      className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors">
      Save as template
    </button>
  )
}
