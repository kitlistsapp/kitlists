'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadInvite()
  }, [token])

  const loadInvite = async () => {
    // Check if already logged in
    const { data: { user } } = await supabase.auth.getUser()

    const { data: inv } = await supabase
      .from('list_collaborators')
      .select('*, gear_lists(project_name), profiles!invited_by(full_name, company_name)')
      .eq('token', token)
      .single()

    if (!inv) { setError('This invite link is invalid or has expired.'); setLoading(false); return }
    if (inv.accepted_at) { setError('This invite has already been accepted.'); setLoading(false); return }

    setInvite(inv)
    if (inv.invited_email) setEmail(inv.invited_email)

    // If already logged in with the right email, accept immediately
    if (user && user.email === inv.invited_email) {
      await supabase
        .from('list_collaborators')
        .update({ accepted_at: new Date().toISOString(), collaborator_id: user.id })
        .eq('id', inv.id)
      router.push(`/lists/${inv.list_id}`)
      return
    }

    setLoading(false)
  }

  const acceptInvite = async (inviteId: string, userId: string, listId: string) => {
    await supabase
      .from('list_collaborators')
      .update({ accepted_at: new Date().toISOString(), collaborator_id: userId })
      .eq('id', inviteId)

    router.push(`/lists/${listId}`)
  }

  const handleLogin = async () => {
    setSubmitting(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setSubmitting(false); return }
    if (data.user) await acceptInvite(invite.id, data.user.id, invite.list_id)
  }

  const handleSignup = async () => {
    setSubmitting(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); setSubmitting(false); return }
    if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName })
      await acceptInvite(invite.id, data.user.id, invite.list_id)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Loading invite...</p>
    </div>
  )

  if (error && !invite) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white mb-2">Kit<span className="text-[#FFE135]">Lists</span></h1>
        <p className="text-zinc-400 text-sm mt-6">{error}</p>
        <a href="/dashboard" className="mt-4 inline-block text-[#FFE135] text-sm hover:underline">Go to dashboard</a>
      </div>
    </div>
  )

  const list = invite?.gear_lists as any
  const invitedBy = invite?.profiles as any

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">Kit<span className="text-[#FFE135]">Lists</span></h1>
        <p className="text-zinc-500 text-xs mb-8">Camera equipment management</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-zinc-400 text-sm mb-1">You have been invited to collaborate on</p>
          <p className="text-white font-semibold text-lg">{list?.project_name}</p>
          {invitedBy?.full_name && (
            <p className="text-zinc-500 text-xs mt-1">Invited by {invitedBy.full_name}{invitedBy.company_name ? ` · ${invitedBy.company_name}` : ''}</p>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('login')}
              className={"flex-1 py-2 rounded-lg text-sm font-medium transition-colors " + (mode === 'login' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
              Log in
            </button>
            <button onClick={() => setMode('signup')}
              className={"flex-1 py-2 rounded-lg text-sm font-medium transition-colors " + (mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
              Create account
            </button>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={submitting}
              className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {submitting ? 'Accepting...' : mode === 'login' ? 'Log in & accept' : 'Create account & accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
