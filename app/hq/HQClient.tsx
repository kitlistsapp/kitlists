'use client'

import { useState } from 'react'

type UserRow = {
  id: string
  email: string
  name: string | null
  company: string | null
  role: string | null
  createdAt: string
  lastSignInAt: string | null
  lists: number
  sentLists: number
  sharesSent: number
  lastListAt: string | null
  lastShareAt: string | null
  activityAt: string | null
  activityType: 'shared' | 'created' | null
  dormant: boolean
}

type OutreachRow = {
  id: string
  email: string
  name: string | null
  template: string
  sentAt: string
  signedUp: boolean
}

type Stats = {
  totalUsers: number
  newThisWeek: number
  newThisMonth: number
  activeThisWeek: number
  totalLists: number
  sentLists: number
  listsThisWeek: number
  totalShares: number
  dormantUsers: number
  invitesSent: number
  invitesConverted: number
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white text-3xl font-black">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function HQClient({ stats, users, outreach, adminEmail }: {
  stats: Stats
  users: UserRow[]
  outreach: OutreachRow[]
  adminEmail: string
}) {
  const [tab, setTab] = useState<'overview' | 'users' | 'outreach'>('overview')

  // Outreach state
  const [template, setTemplate] = useState<'invite' | 'followup' | 'reengage'>('invite')
  const [rawRecipients, setRawRecipients] = useState('')
  const [selectedDormant, setSelectedDormant] = useState<Set<string>>(new Set())
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: string[]; failed: { email: string; error: string }[] } | null>(null)
  const [testEmail, setTestEmail] = useState('whitakerleebo@gmail.com')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const dormantUsers = users.filter(u => u.dormant)

  // People we've invited (or followed up) who still have no account — latest send per email
  const pendingInvitees = (() => {
    const seen = new Map<string, OutreachRow>()
    for (const o of outreach) {
      if (o.signedUp) continue
      if (o.template !== 'invite' && o.template !== 'followup') continue
      const key = o.email.toLowerCase()
      if (!seen.has(key)) seen.set(key, o) // outreach is sorted newest-first
    }
    return Array.from(seen.values())
  })()

  const parseRecipients = () => {
    // Accepts one per line: "email", "Name, email", "Name <email>", "email, Name"
    const out: { email: string; name?: string }[] = []
    for (const line of rawRecipients.split('\n')) {
      const t = line.trim()
      if (!t) continue
      const angle = t.match(/^(.*)<([^>]+)>\s*$/)
      if (angle) { out.push({ name: angle[1].trim().replace(/,$/, '') || undefined, email: angle[2].trim() }); continue }
      const parts = t.split(',').map(p => p.trim()).filter(Boolean)
      if (parts.length === 1) { out.push({ email: parts[0] }); continue }
      const emailPart = parts.find(p => p.includes('@'))
      const namePart = parts.find(p => !p.includes('@'))
      if (emailPart) out.push({ email: emailPart, name: namePart || undefined })
    }
    return out
  }

  const recipients = template === 'reengage'
    ? [
        ...dormantUsers.filter(u => selectedDormant.has(u.id)).map(u => ({ email: u.email, name: u.name || undefined })),
        ...parseRecipients(),
      ]
    : template === 'followup'
    ? [
        ...pendingInvitees.filter(p => selectedPending.has(p.email.toLowerCase())).map(p => ({ email: p.email, name: p.name || undefined })),
        ...parseRecipients(),
      ]
    : parseRecipients()

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const sampleName = recipients[0]?.name?.split(' ')[0] || 'Alex'
      const res = await fetch(`/api/hq/outreach?template=${template}&name=${encodeURIComponent(sampleName)}`)
      const data = await res.json()
      if (res.ok) setPreview(data)
    } finally {
      setPreviewLoading(false)
    }
  }

  const sendTest = async () => {
    if (!testEmail.trim()) return
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/hq/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, testEmail: testEmail.trim(), template }),
      })
      const data = await res.json()
      setTestResult(res.ok ? `✓ Test sent to ${testEmail.trim()}` : `✗ ${data.error || 'Test failed'}`)
    } catch {
      setTestResult('✗ Test failed')
    } finally {
      setTestSending(false)
    }
  }

  const send = async () => {
    if (recipients.length === 0) return
    if (!confirm(`Send "${template}" email to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}?`)) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/hq/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, template }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setRawRecipients('')
        setSelectedDormant(new Set())
        setSelectedPending(new Set())
      } else {
        alert(data.error || 'Send failed')
      }
    } finally {
      setSending(false)
    }
  }

  const tabBtn = (key: typeof tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-[#FFE135] text-black' : 'text-zinc-400 hover:text-white'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-white">Kit<span className="text-[#FFE135]">Lists</span></a>
          <span className="text-xs font-bold tracking-widest uppercase bg-zinc-900 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full">HQ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-xs hidden sm:block">{adminEmail}</span>
          <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1.5 w-fit">
          {tabBtn('overview', 'Overview')}
          {tabBtn('users', `Users (${stats.totalUsers})`)}
          {tabBtn('outreach', 'Outreach')}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Signups</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total users" value={stats.totalUsers} />
                <StatCard label="New this week" value={stats.newThisWeek} />
                <StatCard label="New this month" value={stats.newThisMonth} />
                <StatCard label="Active this week" value={stats.activeThisWeek} sub="created or shared a list, last 7 days" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Gear lists</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total lists" value={stats.totalLists} />
                <StatCard label="Sent lists" value={stats.sentLists} />
                <StatCard label="Created this week" value={stats.listsThisWeek} />
                <StatCard label="Share links" value={stats.totalShares} />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Adoption</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Dormant users" value={stats.dormantUsers} sub="no list created or shared in 21+ days" />
                <StatCard label="Invites sent" value={stats.invitesSent} sub="to non-users" />
                <StatCard label="Invites converted" value={stats.invitesConverted} sub="signed up after invite" />
                <StatCard
                  label="Conversion"
                  value={stats.invitesSent ? `${Math.round((stats.invitesConverted / stats.invitesSent) * 100)}%` : '—'}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Last sign in</th>
                  <th className="px-4 py-3 font-semibold">Last activity</th>
                  <th className="px-4 py-3 font-semibold text-right">Lists</th>
                  <th className="px-4 py-3 font-semibold text-right">Sent</th>
                  <th className="px-4 py-3 font-semibold text-right">Shares</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/60">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.name || '—'}</p>
                      <p className="text-zinc-500 text-xs">{u.email}{u.company ? ` · ${u.company}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{u.role || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fmtDate(u.lastSignInAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.activityAt ? (
                        <>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${u.activityType === 'shared' ? 'bg-[#FFE135]/15 text-[#FFE135]' : 'bg-zinc-800 text-zinc-300'}`}>
                            {u.activityType === 'shared' ? 'SHARED' : 'CREATED'}
                          </span>
                          <span className="text-zinc-400">{fmtDate(u.activityAt)}</span>
                        </>
                      ) : <span className="text-zinc-600">never</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-white">{u.lists}</td>
                    <td className="px-4 py-3 text-right text-white">{u.sentLists}</td>
                    <td className="px-4 py-3 text-right text-white">{u.sharesSent}</td>
                    <td className="px-4 py-3">
                      {u.dormant
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">DORMANT</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE135]/15 text-[#FFE135]">ACTIVE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── OUTREACH ── */}
        {tab === 'outreach' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">Send emails</h2>

                <label className="text-zinc-400 text-sm mb-1.5 block">Template</label>
                <div className="flex gap-2 mb-5 flex-wrap">
                  {([
                    ['invite', 'Invite — new people'],
                    ['followup', 'Follow-up — no signup yet'],
                    ['reengage', 'Re-engage — dormant users'],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => { setTemplate(key); setPreview(null); setResult(null) }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${template === key ? 'bg-[#FFE135] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {template === 'followup' && (
                  pendingInvitees.length > 0 ? (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 text-sm">Invited, no account yet ({pendingInvitees.length})</label>
                        <button
                          onClick={() => setSelectedPending(selectedPending.size === pendingInvitees.length ? new Set() : new Set(pendingInvitees.map(p => p.email.toLowerCase())))}
                          className="text-[#FFE135] text-xs hover:underline">
                          {selectedPending.size === pendingInvitees.length ? 'Clear all' : 'Select all'}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800/60">
                        {pendingInvitees.map(p => (
                          <label key={p.email} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-800/50">
                            <input
                              type="checkbox"
                              checked={selectedPending.has(p.email.toLowerCase())}
                              onChange={e => {
                                const next = new Set(selectedPending)
                                if (e.target.checked) next.add(p.email.toLowerCase()); else next.delete(p.email.toLowerCase())
                                setSelectedPending(next)
                              }}
                              className="accent-[#FFE135]"
                            />
                            <div className="min-w-0">
                              <p className="text-white text-sm truncate">{p.name || p.email}</p>
                              <p className="text-zinc-500 text-xs truncate">{p.email} · last emailed {fmtDate(p.sentAt)} ({p.template})</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm mb-5">No pending invitees yet — once you send invites, anyone who hasn&apos;t signed up will appear here for follow-up.</p>
                  )
                )}

                {template === 'reengage' && dormantUsers.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-400 text-sm">Dormant users ({dormantUsers.length})</label>
                      <button
                        onClick={() => setSelectedDormant(selectedDormant.size === dormantUsers.length ? new Set() : new Set(dormantUsers.map(u => u.id)))}
                        className="text-[#FFE135] text-xs hover:underline">
                        {selectedDormant.size === dormantUsers.length ? 'Clear all' : 'Select all'}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800/60">
                      {dormantUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-800/50">
                          <input
                            type="checkbox"
                            checked={selectedDormant.has(u.id)}
                            onChange={e => {
                              const next = new Set(selectedDormant)
                              if (e.target.checked) next.add(u.id); else next.delete(u.id)
                              setSelectedDormant(next)
                            }}
                            className="accent-[#FFE135]"
                          />
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{u.name || u.email}</p>
                            <p className="text-zinc-500 text-xs truncate">{u.email} · {u.lists} lists · last activity {u.activityAt ? fmtDate(u.activityAt) : 'never'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label className="text-zinc-400 text-sm mb-1.5 block">
                  {template === 'invite' ? 'Recipients (one per line — "Name, email" or just email)' : 'Extra recipients (optional, one per line)'}
                </label>
                <textarea
                  value={rawRecipients}
                  onChange={e => setRawRecipients(e.target.value)}
                  rows={6}
                  placeholder={'Jane Smith, jane@example.com\nmark@example.com\nSam Lee <sam@example.com>'}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors font-mono"
                />

                {/* Test send — always try this before a real batch */}
                <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <label className="text-zinc-400 text-sm mb-1.5 block">Send a test first</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={e => setTestEmail(e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FFE135] transition-colors"
                    />
                    <button onClick={sendTest} disabled={testSending || !testEmail.trim()}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 whitespace-nowrap">
                      {testSending ? 'Sending…' : 'Send test'}
                    </button>
                  </div>
                  {testResult && (
                    <p className={`text-xs mt-2 ${testResult.startsWith('✓') ? 'text-[#FFE135]' : 'text-red-400'}`}>{testResult} <span className="text-zinc-600">— subject is prefixed [TEST], not recorded in history</span></p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button onClick={send} disabled={sending || recipients.length === 0}
                    className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40">
                    {sending ? 'Sending…' : `Send to ${recipients.length || 0}`}
                  </button>
                  <button onClick={loadPreview} disabled={previewLoading}
                    className="text-zinc-400 hover:text-white text-sm transition-colors">
                    {previewLoading ? 'Loading…' : 'Preview email'}
                  </button>
                </div>

                {result && (
                  <div className="mt-4 text-sm">
                    <p className="text-[#FFE135]">✓ Sent {result.sent.length} email{result.sent.length === 1 ? '' : 's'}</p>
                    {result.failed.length > 0 && (
                      <div className="text-red-400 mt-1">
                        {result.failed.map(f => <p key={f.email}>✗ {f.email} — {f.error}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">Outreach history ({outreach.length})</h2>
                {outreach.length === 0 ? (
                  <p className="text-zinc-500 text-sm">Nothing sent yet.</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800/60">
                    {outreach.map(o => (
                      <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{o.name || o.email}</p>
                          <p className="text-zinc-500 text-xs truncate">{o.email} · {o.template} · {fmtDate(o.sentAt)}</p>
                        </div>
                        {o.template === 'invite' && (
                          o.signedUp
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE135]/15 text-[#FFE135] flex-shrink-0">SIGNED UP</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 flex-shrink-0">NO ACCOUNT</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 h-fit lg:sticky lg:top-20">
              <h2 className="text-white font-bold mb-4">Preview</h2>
              {preview ? (
                <>
                  <p className="text-zinc-400 text-sm mb-3"><span className="text-zinc-600">Subject:</span> {preview.subject}</p>
                  <iframe
                    srcDoc={preview.html}
                    title="Email preview"
                    className="w-full h-[600px] rounded-xl border border-zinc-800 bg-white"
                  />
                </>
              ) : (
                <p className="text-zinc-500 text-sm">Hit &quot;Preview email&quot; to see what recipients will get.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
