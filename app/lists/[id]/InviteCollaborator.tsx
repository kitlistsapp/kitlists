'use client'

import { useState, useEffect, useRef } from 'react'

function ContactPicker({ contacts, onSelect }: { contacts: any[], onSelect: (c: any) => void }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-zinc-800 border border-zinc-700 text-left rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] flex items-center justify-between">
        <span className={selected ? 'text-white' : 'text-zinc-500'}>
          {selected ? `${selected.full_name}${selected.email ? ' — ' + selected.email : ''}` : 'Pick from saved contacts…'}
        </span>
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          {contacts.map(c => (
            <button type="button" key={c.id} onClick={() => { setSelected(c); onSelect(c); setOpen(false) }}
              className={"w-full text-left px-4 py-2.5 text-sm transition-colors " + (selected?.id === c.id ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800')}>
              <span className="font-medium">{c.full_name}</span>
              {c.email && <span className="text-zinc-500 ml-2 text-xs">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InviteCollaborator({ listId, contacts }: { listId: string, contacts: any[] }) {
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
            <h3 className="text-white font-semibold mb-1">Invite 1st AC</h3>
            <p className="text-zinc-500 text-xs mb-5">They will get full edit access to this list.</p>
            {sent ? (
              <p className="text-green-400 text-sm text-center py-4">Invite sent!</p>
            ) : (
              <div className="space-y-3">
                {contacts.length > 0 && (
                  <ContactPicker contacts={contacts} onSelect={(c: any) => { if (c.email) setEmail(c.email) }} />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                  placeholder="Email address"
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                    Cancel
                  </button>
                  <button onClick={sendInvite} disabled={sending || !email.trim()}
                    className="flex-1 bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
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
