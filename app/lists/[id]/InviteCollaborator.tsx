'use client'

import { useState } from 'react'

export default function InviteCollaborator({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const sendInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    setError('')
    const res = await fetch('/api/invite-collaborator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, invitedEmail: email.trim() })
    })
    const data = await res.json()
    setSending(false)
    if (data.error) { setError(data.error); return }
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); setEmail('') }, 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">
        Invite 1st AC
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-1">Invite collaborator</h3>
            <p className="text-zinc-500 text-xs mb-5">They will get full edit access to this list.</p>
            {sent ? (
              <p className="text-green-400 text-sm text-center py-4">Invite sent!</p>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                  placeholder="Email address"
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                    Cancel
                  </button>
                  <button onClick={sendInvite} disabled={sending || !email.trim()}
                    className="flex-1 bg-orange-400 hover:bg-orange-300 text-black font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
                    {sending ? 'Sending...' : 'Send invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
