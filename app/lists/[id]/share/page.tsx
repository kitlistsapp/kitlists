'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [listId, setListId] = useState('')
  const [shares, setShares] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('rental')
  const [newMode, setNewMode] = useState('full')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => { setListId(p.id); loadShares(p.id) })
  }, [])

  const loadShares = async (lid: string) => {
    const { data } = await supabase.from('list_shares').select('*').eq('list_id', lid).order('created_at')
    if (data) setShares(data)
  }

  const createShare = async () => {
    setCreating(true)
    const { data } = await supabase.from('list_shares').insert({
      list_id: listId,
      recipient_email: newEmail.trim() || null,
      role: newRole,
      view_mode: newMode
    }).select().single()
    if (data) { setShares(prev => [...prev, data]); setNewEmail('') }
    setCreating(false)
  }

  const deleteShare = async (id: string) => {
    await supabase.from('list_shares').delete().eq('id', id)
    setShares(prev => prev.filter(s => s.id !== id))
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Share this list</h2>
        <p className="text-zinc-500 text-sm mb-8">Generate links to share with your rental house, focus puller, or production</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Create new share link</h3>

          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Recipient email (optional)</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="e.g. rentals@southerncrosscameras.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-2 block">Recipient type</label>
              <div className="flex gap-2">
                {['rental', 'ac', 'production'].map(r => (
                  <button key={r} onClick={() => { setNewRole(r); if (r === 'production') setNewMode('production_clean') else setNewMode('full') }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${ newRole === r ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' }`}>
                    {r === 'ac' ? 'Focus puller / AC' : r === 'rental' ? 'Rental house' : 'Production'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-2 block">View mode</label>
              <div className="flex gap-2">
                <button onClick={() => setNewMode('full')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ newMode === 'full' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' }`}>
                  Full — shows DOP ownership
                </button>
                <button onClick={() => setNewMode('production_clean')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ newMode === 'production_clean' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' }`}>
                  Clean — hides ownership
                </button>
              </div>
              <p className="text-zinc-600 text-xs mt-2">
                {newMode === 'production_clean' ? 'DOP-owned items show as "Supplied" — production won\'t see who owns what.' : 'Full details shown including which items are DOP-owned.'}
              </p>
            </div>

            <button onClick={createShare} disabled={creating}
              className="w-full bg-orange-400 hover:bg-orange-300 text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Generate share link'}
            </button>
          </div>
        </div>

        {shares.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Active share links</h3>
            {shares.map(share => (
              <div key={share.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ share.role === 'production' ? 'bg-blue-900 text-blue-400' : share.role === 'rental' ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-400' }`}>
                      {share.role === 'ac' ? 'Focus puller' : share.role}
                    </span>
                    <span className="text-xs text-zinc-600">{share.view_mode === 'production_clean' ? 'Clean view' : 'Full view'}</span>
                  </div>
                  {share.recipient_email && <p className="text-zinc-500 text-xs mt-1">{share.recipient_email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(share.token)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {copied === share.token ? 'Copied!' : 'Copy link'}
                  </button>
                  <button onClick={() => deleteShare(share.id)}
                    className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}