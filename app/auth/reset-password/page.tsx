'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleReset = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-white text-4xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-white text-xl font-bold mb-2">Password updated!</h2>
              <p className="text-zinc-400 text-sm">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-bold mb-2">Set new password</h2>
              <p className="text-zinc-400 text-sm mb-6">Choose a strong password for your account.</p>
              <div className="space-y-4">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <p className="text-zinc-600 text-xs">Min 8 characters, including uppercase, number and symbol</p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button onClick={handleReset} disabled={loading}
                  className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
