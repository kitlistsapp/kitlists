'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else if (data.user) {
        await supabase.from('profiles').update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          company_name: companyName.trim()
        }).eq('id', data.user.id)
        setMessage('Check your email to confirm your account.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-white text-4xl font-bold tracking-tight">
            Kit<span className="text-orange-400">List</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 tracking-widest uppercase">
            Camera Equipment Platform
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white text-lg font-medium mb-5">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h2>

          <div className="space-y-3">
            {isSignUp && (
              <>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Full name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Aaron McKlisky ACS"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Company name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. McLisky Camera Co"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0400 000 000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
                </div>
              </>
            )}

            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
            </div>
          </div>

          {message && <p className="mt-4 text-sm text-orange-400">{message}</p>}

          <button onClick={handleAuth} disabled={loading}
            className="w-full mt-5 bg-orange-400 hover:bg-orange-300 text-black font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-50">
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <button onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="text-zinc-700 text-xs text-center mt-8">
          KitList · Built for DOPs & Camera Crew
        </p>
      </div>
    </div>
  )
}
