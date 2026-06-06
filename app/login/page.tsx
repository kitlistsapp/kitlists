"use client"

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function AddToHomeScreenBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = (window.navigator as any).standalone === true
    const android = /android/i.test(navigator.userAgent)
    const dismissed = localStorage.getItem('pwa_banner_dismissed')
    if (!standalone && !dismissed && (ios || android)) {
      setIsIOS(ios)
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex items-start gap-3 shadow-xl max-w-sm mx-auto">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <img src="/icon-192.png" alt="KitLists" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold mb-0.5">Add to Home Screen</p>
          {isIOS ? (
            <p className="text-zinc-400 text-xs leading-relaxed">
              Tap the <span className="text-white">Share</span> button in Safari then tap <span className="text-white">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-zinc-400 text-xs leading-relaxed">
              Tap <span className="text-white">Add to Home Screen</span> in your browser menu for quick access
            </p>
          )}
        </div>
        <button
          onClick={() => { localStorage.setItem('pwa_banner_dismissed', '1'); setShow(false) }}
          className="text-zinc-600 hover:text-zinc-400 flex-shrink-0 mt-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const searchParams = useSearchParams()
  useEffect(() => { if (searchParams.get('signup') === 'true') setIsSignUp(true) }, [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            company_name: companyName.trim()
          }
        }
      })
      if (error) {
        setMessage(error.message)
      } else {
        setCheckEmail(true)
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

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin + '/auth/reset-password'
    })
    setForgotLoading(false)
    setForgotSent(true)
  }

  if (showForgot) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-white text-4xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {forgotSent ? (
            <div className="text-center">
              
              <h2 className="text-white text-xl font-bold mb-2">Check your email</h2>
              <p className="text-zinc-400 text-sm mb-4">We sent a password reset link to <span className="text-white font-medium">{forgotEmail}</span></p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false) }} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Back to sign in</button>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-bold mb-2">Reset your password</h2>
              <p className="text-zinc-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <div className="space-y-4">
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135]" />
                <button onClick={handleForgot} disabled={forgotLoading}
                  className="w-full bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm disabled:opacity-50">
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
                <button onClick={() => setShowForgot(false)} className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (checkEmail) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-white text-4xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          
          <h2 className="text-white text-xl font-bold mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-4">We sent a confirmation link to <span className="text-white font-medium">{email}</span></p>
          <p className="text-zinc-600 text-xs">Click the link in the email to confirm your account and get started.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <a href="/" className="inline-block">
            <h1 className="text-white text-4xl font-bold tracking-tight">
              Kit<span className="text-[#FFE135]">Lists</span>
            </h1>
          </a>
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
                    placeholder="e.g. Jane Smith ACS"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Company name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. My Film Pty Ltd"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0400 000 000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors" />
                </div>
              </>
            )}

            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FFE135] transition-colors" />
            </div>

            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#FFE135] transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          {isSignUp && <p className="text-zinc-600 text-xs mt-2">Min 8 characters, including uppercase, number and symbol</p>}
          {!isSignUp && <div className="text-right mt-1"><button type="button" onClick={() => setShowForgot(true)} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Forgot password?</button></div>}

          {message && <p className="mt-4 text-sm text-[#FFE135]">{message}</p>}

          <button onClick={handleAuth} disabled={loading}
            className="w-full mt-5 bg-[#FFE135] hover:bg-[#FFD700] text-black font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-50">
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <button onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="text-zinc-700 text-xs text-center mt-8">
          KitLists · Built for DOPs, ACs, Rental Houses and Production
        </p>
      </div>
      <AddToHomeScreenBanner />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
