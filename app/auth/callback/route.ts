import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Fire welcome email — non-blocking
      if (data?.user?.email) {
        const firstName = data.user.user_metadata?.full_name?.split(' ')[0]
        fetch(`${origin}/api/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.user.email, firstName }),
        }).catch(console.error)
      }
      return NextResponse.redirect(origin + '/auth/complete')
    }
  }

  return NextResponse.redirect(origin + '/login?error=auth')
}
