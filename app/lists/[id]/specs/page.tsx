'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Lut { id: string; name: string; file_url: string }
interface ListLut { id: string; name: string; source: string; profile_lut_id?: string; file_path?: string }

export default function ShootSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const lutFileRef = useRef<HTMLInputElement>(null)
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [specId, setSpecId] = useState<string | null>(null)
  const [format, setFormat] = useState('')
  const [resolution, setResolution] = useState('')
  const [fps, setFps] = useState('')
  const [aspectRatio, setAspectRatio] = useState('')
  const [jobNotes, setJobNotes] = useState('')
  const [profileLuts, setProfileLuts] = useState<Lut[]>([])
  const [listLuts, setListLuts] = useState<ListLut[]>([])
  const [showLutPicker, setShowLutPicker] = useState(false)
  const [lutUploading, setLutUploading] = useState(false)

  useEffect(() => {
    params.then(p => { setListId(p.id); loadData(p.id) })
  }, [])

  const loadData = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [{ data: spec }, { data: luts }, { data: listLutData }] = await Promise.all([
      supabase.from('shoot_specs').select('*').eq('list_id', lid).maybeSingle(),
      supabase.from('user_luts').select('*').eq('owner_id', user.id).order('name'),
      supabase.from('list_lut_files').select('*').eq('list_id', lid).order('created_at')
    ])
    if (spec) {
      setSpecId(spec.id)
      setFormat(spec.format || '')
      setResolution(spec.resolution || '')
      setFps(spec.fps || '')
      setAspectRatio(spec.aspect_ratio || '')
      setJobNotes(spec.job_notes || '')
    }
    if (luts) setProfileLuts(luts)
    if (listLutData) setListLuts(listLutData)
  }

  const save = async () => {
    setSaving(true)
    const payload = { list_id: listId, format, resolution, fps, lut: listLuts.map(l => l.name).join(', '), aspect_ratio: aspectRatio, job_notes: jobNotes }
    if (specId) {
      await supabase.from('shoot_specs').update(payload).eq('id', specId)
    } else {
      const { data } = await supabase.from('shoot_specs').insert(payload).select().single()
      if (data) setSpecId(data.id)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addProfileLut = async (lut: Lut) => {
    if (listLuts.find(l => l.profile_lut_id === lut.id)) return
    const { data } = await supabase.from('list_lut_files').insert({
      list_id: listId, owner_id: userId, name: lut.name, source: 'profile', profile_lut_id: lut.id
    }).select().single()
    if (data) setListLuts(prev => [...prev, data])
    setShowLutPicker(false)
  }

  const uploadLutFile = async (file: File) => {
    if (!file || !userId) return
    setLutUploading(true)
    const lutName = file.name
    const ext = file.name.split('.').pop()
    const path = userId + '/list-' + listId + '-' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('luts').upload(path, file)
    if (!error) {
      const { data } = await supabase.from('list_lut_files').insert({
        list_id: listId, owner_id: userId, name: lutName, file_path: path, source: 'upload'
      }).select().single()
      if (data) setListLuts(prev => [...prev, data])
    }
    setLutUploading(false)
  }

  const removeLut = async (id: string) => {
    await supabase.from('list_lut_files').delete().eq('id', id)
    setListLuts(prev => prev.filter(l => l.id !== id))
  }

  const fpsOptions = ['23.976fps', '24fps', '25fps', '29.97fps', '48fps', '50fps', '60fps']
  const aspectOptions = ['2.39:1', '2.35:1', '1.85:1', '1.78:1 (16:9)', '1.33:1 (4:3)', '2:1']

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">List</span></a>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved</span>}
          <button onClick={save} disabled={saving} className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-8">Shoot specs</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Format / Codec</label>
            <input type="text" value={format} onChange={e => setFormat(e.target.value)} placeholder="e.g. ARRIRAW, ProRes 4444, X-OCN XT"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Resolution</label>
            <input type="text" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="e.g. 4.6K, 8K, 4K LF"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Project frame rate</label>
            <input type="text" value={fps} onChange={e => setFps(e.target.value)} placeholder="e.g. 25fps"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] mb-2" />
            <div className="flex gap-2 flex-wrap">
              {fpsOptions.map(o => (
                <button key={o} onClick={() => setFps(o)} className={`px-3 py-1 rounded-full text-xs border transition-colors ${ fps === o ? 'bg-[#FFE135] border-[#FFE135] text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' }`}>{o}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Aspect ratio</label>
            <input type="text" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} placeholder="e.g. 2.39:1"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] mb-2" />
            <div className="flex gap-2 flex-wrap">
              {aspectOptions.map(o => (
                <button key={o} onClick={() => setAspectRatio(o)} className={`px-3 py-1 rounded-full text-xs border transition-colors ${ aspectRatio === o ? 'bg-[#FFE135] border-[#FFE135] text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' }`}>{o}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-3 block">LUTs</label>
            {listLuts.length > 0 && (
              <div className="space-y-2 mb-3">
                {listLuts.map(lut => (
                  <div key={lut.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{lut.source === 'upload' && lut.file_path && !lut.name.includes('.') ? lut.name + '.' + lut.file_path.split('.').pop() : lut.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ lut.source === 'profile' ? 'bg-zinc-700 text-zinc-400' : 'bg-blue-900 text-blue-400' }`}>{lut.source === 'profile' ? 'Profile' : 'Uploaded'}</span>
                    </div>
                    <button onClick={() => removeLut(lut.id)} className="text-zinc-600 hover:text-red-400 text-lg transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {profileLuts.length > 0 && (
                <button onClick={() => setShowLutPicker(!showLutPicker)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
                  + Pick from profile
                </button>
              )}
              <button onClick={() => lutFileRef.current?.click()}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
                {lutUploading ? 'Uploading...' : '+ Upload LUT file'}
              </button>
              <input ref={lutFileRef} type="file" accept=".cube,.3dl,.lut,.clf,.aml,.alf4" className="hidden"
                onChange={e => e.target.files?.[0] && uploadLutFile(e.target.files[0])} />
            </div>
            {showLutPicker && profileLuts.length > 0 && (
              <div className="mt-2 border border-zinc-700 rounded-xl overflow-hidden">
                {profileLuts.map(l => (
                  <button key={l.id} onClick={() => addProfileLut(l)}
                    className={`w-full text-left px-4 py-2.5 text-sm border-b border-zinc-800 last:border-0 transition-colors ${ listLuts.find(ll => ll.profile_lut_id === l.id) ? 'text-zinc-600 cursor-default' : 'text-zinc-300 hover:bg-zinc-800' }`}>
                    {l.name}
                    {listLuts.find(ll => ll.profile_lut_id === l.id) && <span className="text-[#FFE135] ml-2 text-xs">✓ added</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Shoot spec notes</label>
            <textarea value={jobNotes} onChange={e => setJobNotes(e.target.value)}
              placeholder="Car rigs, remote heads, cranes, special requirements..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] resize-none" />
          </div>
        </div>
      </main>
    </div>
  )
}