'use client'

interface NavBarClientProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
  isLoggedIn?: boolean
}

export default function NavBarClient({ backHref, backLabel, rightContent, isLoggedIn }: NavBarClientProps) {
  return (
    <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-black z-40">
      <div className="flex items-center gap-4">
        <a href={isLoggedIn ? "/dashboard" : "/"} className="text-xl font-bold text-white">
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
        {isLoggedIn ? (
          <>
            <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Dashboard</a>
            <a href="/profile" className="text-zinc-400 hover:text-white text-sm transition-colors">My Profile</a>
            <a href="/auth/signout" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign out</a>
          </>
        ) : (
          <>
            <a href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign in</a>
            <a href="/login?signup=true" className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Sign up</a>
          </>
        )}
      </div>
    </nav>
  )
}
