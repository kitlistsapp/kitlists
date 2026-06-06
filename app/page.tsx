import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link href="/login?signup=true" className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Sign up</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center px-6 max-w-2xl mx-auto w-full py-20">
        <div className="inline-flex mb-8">
          <span className="text-xs font-semibold tracking-widest uppercase border border-[#FFE135]/40 text-[#FFE135] px-3 py-1.5 rounded-full">Beta — Now open</span>
        </div>

        <h1 className="text-6xl sm:text-7xl font-black leading-none tracking-tight mb-4">
          YOUR KIT.<br />
          <span className="text-[#FFE135]">ORGANISED.</span><br />
          SHARED.
        </h1>

        <p className="text-zinc-500 text-sm mt-2 tracking-widest uppercase mb-2">Camera Equipment Platform</p>
        <p className="text-zinc-400 text-xs tracking-widest uppercase mb-8">Create · Edit · Collaborate · Share</p>

        <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-lg">
          The smarter way to manage your camera kit. Build lists, collaborate with your team and share with rental houses from anywhere — no more back-and-forth emails or clunky spreadsheets.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/login?signup=true" className="bg-[#FFE135] hover:bg-[#FFD700] text-black font-bold px-8 py-4 rounded-xl text-base transition-colors">
            Make a List
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
        </div>
      </main>


    </div>
  )
}
