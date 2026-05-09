'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ShootSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [specId, setSpecId] = useState<string | null>(null)
  const [format, setFormat] = useState('')
  const [resolution, setResolution] = useState('')
  const [fps, setFps] = useState('')
  const [lut, setLut] = useState('')
  const [aspectRatio, setAspectRatio] = useState('')
  const [jobNotes, setJobNotes] = useState('')

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data } = await supabase.from('shoot_specs').select('*').eq('list_id', lid).maybeSingle()
    if (data) {
      setSpecId(data.id)
      setFormat(data.format || '')
      setResolution(data.resolution || '')
      setFps(data.fps || '')
      setLut(data.lut || '')
      setAspectRatio(data.aspect_ratio || '')
      setJobNotes(data.job_notes || '')
    }
  }

  const save = async () => {
    setSaving(true)
    const payload = { list_id: listId, format, resolution, fps, lut, aspect_ratio: aspectRatio, job_notes: jobNotes }
    if (specId) {
      await supabase.from('shoot_specs').update(payload).eq('id', specId)
    } else {
      const { data } = await supabase.from('shoot_specs').insert(payload).select().single()
      if (data) setSpecId(data.id)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
    </div>
  )

  const quickPick = (setter: (v: string) => void, options: string[]) => (
    <div className="flex gap-2 flex-wrap mt-2">
      {options.map(o => (
        <button key={o} onClick={() => setter(o)}
          className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700">
          {o}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">Shoot specs</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">

          <div>
            <Field label="Format" value={format} onChange={setFormat} placeholder="e.g. ARRIRAW, ProRes 4444" />
            {quickPick(setFormat, ['ARRIRAW', 'ARRIRAW HDE', 'ProRes 4444', 'ProRes 422 HQ', 'X-OCN XT', 'REDCODE RAW'])}
          </div>

          <div>
            <Field label="Resolution" value={resolution} onChange={setResolution} placeholder="e.g. 4.6K, 8K, 4K" />
            {quickPick(setResolution, ['4.6K', '4K', '4K LF', '6K', '8K', '2K', '1080p'])}
          </div>

          <div>
            <Field label="Frame rate" value={fps} onChange={setFps} placeholder="e.g. 25fps, 23.976fps" />
            {quickPick(setFps, ['23.976fps', '24fps', '25fps', '29.97fps', '48fps', '50fps', '60fps'])}
          </div>

          <div>
            <Field label="LUT" value={lut} onChange={setLut} placeholder="e.g. ARRI LogC, S-Log3" />
            {quickPick(setLut, ['ARRI LogC3', 'ARRI LogC4', 'S-Log3', 'REDWideGamutRGB', 'Venice v2'])}
          </div>

          <div>
            <Field label="Aspect ratio" value={aspectRatio} onChange={setAspectRatio} placeholder="e.g. 2.39:1, 1.78:1" />
            {quickPick(setAspectRatio, ['2.39:1', '2.35:1', '1.85:1', '1.78:1 (16:9)', '1.33:1 (4:3)', '2:1'])}
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Job notes</label>
            <textarea value={jobNotes} onChange={e => setJobNotes(e.target.value)}
              placeholder="Car rigs, remote heads, cranes, special requirements..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>
        </div>
      </main>
    </div>
  )
}