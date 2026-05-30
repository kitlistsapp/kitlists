'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCompletePage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const finish = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Check if profile already has data
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      
      if (profile?.full_name) {
        router.push('/dashboard')
      } else {
        router.push('/profile?welcome=1')
      }
    }
    finish()
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-2">Kit<span className="text-[#FFE135]">Lists</span></div>
        <p className="text-zinc-400 text-sm mt-4">Confirming your account...</p>
      </div>
    </div>
  )
}
