'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export default function OtherKitPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const notesRef = useRef('')
  const notesIdRef = useRef<string | null>(null)
  const listIdRef = useRef('')
  const userIdRef = useRef('')

  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { notesIdRef.current = notesId }, [notesId])
  useEffect(() => { listIdRef.current = listId }, [listId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    params.then(p => { setListId(p.id); listIdRef.current = p.id; loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setUserId(user.id); userIdRef.current = user.id }
    const { data } = await supabase.from('list_section_notes').select('*').eq('list_id', lid).eq('section', 'other_kit').maybeSingle()
    if (data) { setNotes(data.notes || ''); setNotesId(data.id); notesIdRef.current = data.id }
  }

  const triggerAutoSave = (delay = 800) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), delay)
  }

  const save = async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setSaving(true)
    const lid = listIdRef.current
    const uid = userIdRef.current
    const n = notesRef.current
    const nid = notesIdRef.current
    if (nid) {
      await supabase.from('list_section_notes').update({ notes: n }).eq('id', nid)
    } else if (n.trim()) {
      const { data: newNote } = await supabase.from('list_section_notes').insert({ list_id: lid, owner_id: uid, section: 'other_kit', notes: n }).select().single()
      if (newNote) { setNotesId(newNote.id); notesIdRef.current = newNote.id }
    }
    isSavingRef.current = false
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={"/lists/" + listId} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Other Kit</h2>
        <p className="text-zinc-500 text-sm mb-6">Anything else not covered by the sections above</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <textarea value={notes} onChange={e => { setNotes(e.target.value); triggerAutoSave(800) }}
            placeholder="List any additional equipment, special requirements or notes here..."
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Back to list
          </a>
          <a href={"/lists/" + listId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors">
            Back to list ✓
          </a>
        </div>
      </main>
    </div>
  )
}
