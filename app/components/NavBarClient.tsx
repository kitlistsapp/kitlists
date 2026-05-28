'use client'

interface NavBarClientProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
}

export default function NavBarClient({ backHref, backLabel, rightContent }: NavBarClientProps) {
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
      </div>
    </nav>
  )
}
