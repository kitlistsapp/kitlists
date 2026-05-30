'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'General Feedback']

export default function FeedbackClient({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) { setError('Please select a feedback type.'); return }
    if (!notes.trim()) { setError('Please add some notes.'); return }

    setLoading(true)
    setError('')

    try {
      const { error: dbError } = await supabase
        .from('feedback')
        .insert({ user_id: userId, type, notes: notes.trim() })

      if (dbError) throw dbError

      await fetch('/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, notes: notes.trim() }),
      })

      setSubmitted(true)
    } catch (err: any) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center px-4">
        <h2 className="text-xl font-semibold text-white">Thanks for your feedback!</h2>
        <p className="text-zinc-400 text-sm">
          We genuinely read every submission. It makes KitLists better.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-6 py-2 rounded-lg bg-[#FFE135] text-black font-semibold text-sm hover:bg-yellow-300 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Share your feedback</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Thank you for being part of our trial group! We're so excited about{' '}
          <span className="text-white font-medium">Kit<span className="text-[#FFE135]">Lists</span></span>{' '}
          and all feedback is genuinely welcome — it directly shapes how we improve the tool.
          Every note gets read.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Type of feedback
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer"
          >
            <option value="" disabled>Select a type…</option>
            {FEEDBACK_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Tell us what you noticed, what you'd love to see, or anything on your mind…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleSubmit as any}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[#FFE135] text-black font-semibold text-sm hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending…' : 'Submit feedback'}
        </button>

      </div>
    </div>
  )
}
