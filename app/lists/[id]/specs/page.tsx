'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Lut { id: string; name: string; notes: string }

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
  const [profileLuts, setProfileLuts] = useState<Lut[]>([])
  const [showLutPicker, setShowLutPicker] = useState(false)

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: spec }, { data: luts }] = await Promise.all([
      supabase.from('shoot_specs').select('*').eq('list_id', lid).maybeSingle(),
      supabase.from('user_luts').select('*').eq('owner_id', user.id).order('name')
    ])
    if (spec) {
      setSpecId(spec.id)
      setFormat(spec.format || '')
      setResolution(spec.resolution || '')
      setFps(spec.fps || '')
      setLut(spec.lut || '')
      setAspectRatio(spec.aspect_ratio || '')
      setJobNotes(spec.job_notes || '')
    }
    if (luts) setProfileLuts(luts)
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

  const fpsOptions = ['23.976fps', '24fps', '25fps', '29.97fps', '48fps', '50fps', '60fps']
  const aspectOptions = ['2.39:1', '2.35:1', '1.85:1', '1.78:1 (16:9)', '1.33:1 (4:3)', '2:1']

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
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Format / Codec</label>
            <input type="text" value={format} onChange={e => setFormat(e.target.value)}
              placeholder="e.g. ARRIRAW, ProRes 4444, X-OCN XT"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Resolution</label>
            <input type="text" value={resolution} onChange={e => setResolution(e.target.value)}
              placeholder="e.g. 4.6K, 8K, 4K LF"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Project frame rate</label>
            <input type="text" value={fps} onChange={e => setFps(e.target.value)}
              placeholder="e.g. 25fps"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors mb-2" />
            <div className="flex gap-2 flex-wrap">
              {fpsOptions.map(o => (
                <button key={o} onClick={() => setFps(o)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${ fps === o ? 'bg-orange-400 border-orange-400 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' }`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Aspect ratio</label>
            <input type="text" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}
              placeholder="e.g. 2.39:1"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors mb-2" />
            <div className="flex gap-2 flex-wrap">
              {aspectOptions.map(o => (
                <button key={o} onClick={() => setAspectRatio(o)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${ aspectRatio === o ? 'bg-orange-400 border-orange-400 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' }`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">LUT</label>
            <input type="text" value={lut} onChange={e => setLut(e.target.value)}
              placeholder="e.g. ARRI LogC3, S-Log3"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors mb-2" />
            {profileLuts.length > 0 && (
              <div>
                <button onClick={() => setShowLutPicker(!showLutPicker)}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors mb-2 block">
                  {showLutPicker ? 'Hide' : '+ Pick from my profile LUTs'}
                </button>
                {showLutPicker && (
                  <div className="border border-zinc-700 rounded-xl overflow-hidden">
                    {profileLuts.map(l => (
                      <button key={l.id} onClick={() => { setLut(l.name); setShowLutPicker(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors">
                        <span className="font-medium">{l.name}</span>
                        {l.notes && <span className="text-zinc-600 text-xs ml-2">{l.notes}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Shoot spec notes</label>
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