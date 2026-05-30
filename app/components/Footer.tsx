import { createClient } from "@/lib/supabase/server"

export default async function Footer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <footer className="border-t border-zinc-800 mt-auto px-4 py-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">
          Kit<span className="text-[#FFE135]">Lists</span>
        </span>
        <div className="flex items-center gap-5">
          <a href="/feedback" className="text-xs text-zinc-500 hover:text-white transition-colors">Share feedback</a>
          <a href="/contact" className="text-xs text-zinc-500 hover:text-white transition-colors">Contact us</a>
        </div>
        <p className="text-xs text-zinc-600">© 2026 KitLists. All rights reserved.</p>
      </div>
    </footer>
  )
}
