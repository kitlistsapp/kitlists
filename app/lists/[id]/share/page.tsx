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
  const [sending, setSending] = useState<string | null>(null)
  const [previewShare, setPreviewShare] = useState<any | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [dopName, setDopName] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    params.then(p => { setListId(p.id); loadShares(p.id); loadListInfo(p.id) })
  }, [])

  const loadShares = async (lid: string) => {
    const { data } = await supabase.from('list_shares').select('*').eq('list_id', lid).order('created_at')
    if (data) setShares(data)
  }

  const loadListInfo = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: list }, { data: profile }] = await Promise.all([
      supabase.from('gear_lists').select('project_name').eq('id', lid).single(),
      supabase.from('profiles').select('full_name, company_name').eq('id', user.id).single()
    ])
    if (list) setListName(list.project_name)
    if (profile) { setDopName(profile.full_name || ''); setCompanyName(profile.company_name || '') }
  }

  const sendEmail = async (share: any) => {
    if (!share.recipient_email) return
    setSending(share.id)
    const res = await fetch('/api/send-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId: share.id, recipientEmail: share.recipient_email, listName, dopName, companyName, token: share.token, listId })
    })
    setSending(null)
    if (res.ok) { setSent(share.id); setTimeout(() => setSent(null), 3000) }
  }

  const previewEmail = async (share: any) => {
    setLoadingPreview(true)
    setPreviewShare(share)
    const res = await fetch('/api/preview-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, listName, dopName, companyName, token: share.token })
    })
    const data = await res.json()
    setPreviewHtml(data.html || '')
    setLoadingPreview(false)
  }

  const createShare = async () => {
    setCreating(true)
    await supabase.from('list_shares').insert({
      list_id: listId,
      recipient_email: newEmail.trim() || null,
      role: newRole,
      view_mode: newMode
    })
    setNewEmail('')
    await loadShares(listId)
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
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-2">Share this list</h2>
        <p className="text-zinc-500 text-sm mb-8">Generate links to share with your rental house, focus puller, or production</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Create new share link</h3>

          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Recipient email (optional)</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="e.g. rentals@southerncrosscameras.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-2 block">Recipient type</label>
              <div className="flex gap-2 flex-wrap">
                {['rental', 'ac', 'production'].map(r => (
                  <button key={r} onClick={() => { setNewRole(r); if (r === 'production') { setNewMode('production_clean') } else { setNewMode('full') } }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${ newRole === r ? 'bg-[#FFE135] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' }`}>
                    {r === 'ac' ? 'Focus puller / AC' : r === 'rental' ? 'Rental house' : 'Production'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-2 block">View mode</label>
              <div className="flex gap-2 flex-wrap">
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
              className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Generate share link'}
            </button>
          </div>
        </div>

        {shares.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Active share links</h3>
            {shares.map(share => (
              <div key={share.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:border-zinc-600 transition-colors" onClick={() => window.open(`/share/${share.token}`, '_blank')}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ share.role === 'production' ? 'bg-blue-900 text-blue-400' : share.role === 'rental' ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-400' }`}>
                      {share.role === 'ac' ? 'Focus puller' : share.role}
                    </span>
                    <span className="text-xs text-zinc-600">{share.view_mode === 'production_clean' ? 'Clean view' : 'Full view'}</span>
                  </div>
                  {share.recipient_email && <p className="text-zinc-500 text-xs mt-1">{share.recipient_email}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={e => { e.stopPropagation(); previewEmail(share) }}
                      className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Preview
                    </button>
                  {share.recipient_email && (
                    <button onClick={e => { e.stopPropagation(); sendEmail(share) }} disabled={sending === share.id}
                      className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      {sending === share.id ? 'Sending...' : sent === share.id ? 'Sent!' : 'Send email'}
                    </button>
                  )}
                  <button onClick={() => copyLink(share.token)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {copied === share.token ? 'Copied!' : 'Copy link'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteShare(share.id) }}
                    className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {previewShare && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewShare(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">Email preview</h3>
                <p className="text-zinc-500 text-xs mt-0.5">This is what the recipient will see</p>
              </div>
              <button onClick={() => setPreviewShare(null)} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingPreview ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-zinc-400 text-sm">Loading preview...</p>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
            </div>
            {previewShare.recipient_email && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-zinc-500 text-xs">To: {previewShare.recipient_email}</p>
                <button onClick={() => { sendEmail(previewShare); setPreviewShare(null) }} disabled={sending === previewShare.id}
                  className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                  {sending === previewShare.id ? 'Sending...' : 'Send now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}