import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/app/components/NavBar'
import FeedbackClient from './FeedbackClient'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <FeedbackClient userId={user.id} />
    </div>
  )
}
