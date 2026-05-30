import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/app/components/NavBar'
import ContactClient from './ContactClient'

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <ContactClient
        defaultEmail={user.email ?? ''}
        defaultName={profile?.full_name ?? ''}
      />
    </div>
  )
}
