import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key.
// NEVER import this in a client component — it bypasses RLS.
// Used exclusively by the /hq admin panel and its API routes.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Comma-separated list of admin emails, e.g. "charlie@example.com,lee@example.com"
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
