import { createClient } from "@/lib/supabase/server"

export default async function Footer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return (
    <footer className="border-t border-zinc-800 mt-auto px-4 py-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">Kit<span className="text-[#FFE135]">Lists</span></span>
        <div className="flex items-center gap-5">
          <a href="/about" className="text-xs text-zinc-500 hover:text-white transition-colors">About</a>
          <a href="/privacy" className="text-xs text-zinc-500 hover:text-white transition-colors">Privacy</a>
          <a href="https://www.instagram.com/kitlists.app" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-[#FFE135] transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Follow us
          </a>
        </div>
        <p className="text-xs text-zinc-600">© 2026 KitLists</p>
      </div>
    </footer>
  )

  return (
    <footer className="border-t border-zinc-800 mt-auto px-4 py-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">
          Kit<span className="text-[#FFE135]">Lists</span>
        </span>
        <div className="flex items-center gap-5">
          <a href="/about" className="text-xs text-zinc-500 hover:text-white transition-colors">About</a>
          <a href="/guide" className="text-xs text-zinc-500 hover:text-white transition-colors">Guide</a>
          <a href="/feedback" className="text-xs text-zinc-500 hover:text-white transition-colors">Feedback</a>
          <a href="/contact" className="text-xs text-zinc-500 hover:text-white transition-colors">Contact</a>
          <a href="https://www.instagram.com/kitlists.app" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-[#FFE135] transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Follow us
          </a>
        </div>
        <p className="text-xs text-zinc-600">© 2026 KitLists</p>
      </div>
    </footer>
  )
}
