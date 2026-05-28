import { createClient } from "@/lib/supabase/server"

interface NavBarProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
}

export default async function NavBar({ backHref, backLabel, rightContent }: NavBarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, company_logo_url').eq('id', user.id).single()
    : { data: null }

  return (
    <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
      <div className="flex items-center gap-4">
        <a href="/dashboard" className="text-xl font-bold text-white">
          Kit<span className="text-[#FFE135]">Lists</span>
        </a>
        {backHref && (
          <a href={backHref} className="text-zinc-500 hover:text-white text-sm transition-colors">
            {backLabel || 'Back'}
          </a>
        )}
      </div>
      <div className="flex items-center gap-4">
        {rightContent}
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors hidden sm:block">Dashboard</a>
        <a href="/profile" className="text-zinc-400 hover:text-white text-sm transition-colors hidden sm:block">My Profile</a>
        <a href="/auth/signout" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign out</a>
      </div>
    </nav>
  )
}
