import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import PhoneTrio from "@/app/components/PhoneMockup"

/* ── Inline SVG icons (stroke) ── */
const ic = "w-5 h-5 text-[#FFE135]"
const Icons = {
  camera: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="4"/></svg>,
  aperture: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg>,
  users: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  eye: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  send: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  layers: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
}

const features = [
  { icon: Icons.camera, title: 'Build lists in minutes', description: 'Camera bodies, power, filtration, AKS, head & legs, gimbals, VTR - every section of a real prep, structured the way you actually work.' },
  { icon: Icons.aperture, title: '4,000+ lens database', description: 'ARRI, ZEISS, Cooke, Canon, Panavision and 100+ more. Browse by manufacturer and series, tap to add. Exact names, zero typing.' },
  { icon: Icons.users, title: 'Prep with your 1st AC', description: 'One tap invites your focus puller onto the list with full edit access. They add their kit, mark it AC-owned, and build alongside you live.' },
  { icon: Icons.eye, title: 'Control who sees what', description: 'Rental house and AC get full detail with DOP/AC ownership badges. Production gets a clean view that just says "Supplied".' },
  { icon: Icons.send, title: 'Send it anywhere', description: 'Email straight from KitLists, share a live link, or download PDF and Excel. LUTs attach automatically for the people who need them.' },
  { icon: Icons.layers, title: 'Templates for every job', description: 'Save a job as a template and reuse the whole package next time. Regular contacts and rental houses are one tap away.' },
]

const steps = [
  { n: '01', title: 'Set up your profile', text: 'Name, company, logo, your own gear and LUTs - ready to appear on every list you share.' },
  { n: '02', title: 'Build your list', text: 'Work through each section, or start from a template of your last job. Your AC preps with you.' },
  { n: '03', title: 'Share with control', text: 'Rental house, 1st AC and production each get exactly the view they need. Nothing more.' },
]

const manufacturers = ['ARRI', 'ZEISS', 'COOKE', 'CANON', 'PANAVISION', 'ATLAS', 'ANGENIEUX', 'LEITZ', 'TOKINA', 'SIGMA']

function Slate({ scene, title }: { scene: string; title: string }) {
  return (
    <div className="inline-flex items-center gap-3 mb-4">
      <span className="font-mono text-[11px] tracking-[0.25em] text-[#FFE135] border border-[#FFE135]/30 px-2.5 py-1 rounded">SC {scene}</span>
      <span className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">{title}</span>
    </div>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></span>
        <div className="flex items-center gap-3 sm:gap-5">
          <a href="#features" className="text-[#FFE135] hover:text-[#FFD700] text-sm font-semibold transition-colors">What is it?</a>
          <Link href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link href="/login?signup=true" className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Sign up</Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative px-6 pt-16 pb-10 sm:pt-24">
          {/* Spotlight glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(closest-side,rgba(255,225,53,0.09),transparent_70%)] pointer-events-none" />
          <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-[radial-gradient(closest-side,rgba(255,225,53,0.05),transparent_70%)] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-8 border border-[#FFE135]/40 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-widest uppercase text-[#FFE135]">Beta - Now open · Free</span>
              </div>

              {/* Frame-guide brackets around headline */}
              <div className="relative inline-block pr-6 pb-2">
                <span className="absolute -top-3 -left-5 w-8 h-8 border-t-2 border-l-2 border-[#FFE135]/50 rounded-tl-sm" aria-hidden />
                <span className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-[#FFE135]/50 rounded-br-sm" aria-hidden />
                <h1 className="text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight">
                  YOUR KIT.<br />
                  <span className="text-[#FFE135] drop-shadow-[0_0_35px_rgba(255,225,53,0.35)]">ORGANISED.</span><br />
                  SHARED.
                </h1>
              </div>

              <p className="text-zinc-500 text-sm mt-6 tracking-widest uppercase mb-2">Camera Equipment Platform</p>
              <p className="text-zinc-400 text-xs tracking-widest uppercase mb-7">Create · Edit · Collaborate · Share</p>

              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-9 max-w-lg">
                One live gear list - built by the DOP and 1st AC together, shared with the rental house and production. No more spreadsheets, email chains or &quot;which version is current?&quot;
              </p>

              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <Link href="/login?signup=true" className="bg-gradient-to-b from-[#FFE135] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFC700] text-black font-bold px-8 py-4 rounded-xl text-base transition-all shadow-[0_10px_40px_-10px_rgba(255,225,53,0.5)]">
                  Make a List
                </Link>
                <Link href="/login" className="border-2 border-[#FFE135] text-[#FFE135] hover:bg-[#FFE135] hover:text-black font-bold px-7 py-[14px] rounded-xl text-base transition-colors">
                  Sign in
                </Link>
                <a href="#features" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold px-6 py-4 rounded-xl text-sm transition-colors">
                  What is it? ↓
                </a>
              </div>
            </div>

            {/* Hero phones */}
            <div className="relative hidden lg:block">
              <PhoneTrio />
            </div>
          </div>

          {/* Mobile phone showcase */}
          <div className="relative mt-14 lg:hidden flex justify-center">
            <PhoneTrio />
          </div>

          {/* Manufacturer strip */}
          <div className="relative max-w-5xl mx-auto mt-20 pt-8 border-t border-zinc-900">
            <p className="text-center text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-4">A lens database covering</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              {manufacturers.map(m => (
                <span key={m} className="font-mono text-xs tracking-[0.2em] text-zinc-600">{m}</span>
              ))}
              <span className="font-mono text-xs tracking-[0.2em] text-[#FFE135]/70">+100 MORE</span>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="relative px-6 py-24 scroll-mt-16">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[radial-gradient(closest-side,rgba(255,225,53,0.04),transparent_70%)] pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <Slate scene="01" title="Why KitLists" />
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Everything a prep needs.<br /><span className="text-zinc-500">Nothing it doesn&apos;t.</span></h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(f => (
                <div key={f.title} className="group bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-[#FFE135]/50 hover:shadow-[0_0_40px_-12px_rgba(255,225,53,0.25)] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#FFE135]/10 border border-[#FFE135]/20 flex items-center justify-center mb-5 group-hover:bg-[#FFE135]/15 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="px-6 py-12 scroll-mt-16">
          <div className="max-w-5xl mx-auto bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl px-8 py-14 sm:px-14 relative overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(closest-side,rgba(255,225,53,0.08),transparent_70%)] pointer-events-none" />
            <div className="relative text-center mb-12">
              <Slate scene="02" title="How it works" />
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Three steps to a sorted kit.</h2>
            </div>
            <div className="relative grid sm:grid-cols-3 gap-10 sm:gap-6">
              {steps.map((s, i) => (
                <div key={s.n} className="relative text-center px-2">
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-6 left-[calc(50%+34px)] right-[calc(-50%+34px)] h-px bg-gradient-to-r from-[#FFE135]/40 to-zinc-800" aria-hidden />
                  )}
                  <div className="relative w-12 h-12 mx-auto rounded-full border-2 border-[#FFE135] flex items-center justify-center mb-5 shadow-[0_0_25px_-5px_rgba(255,225,53,0.4)]">
                    <span className="font-mono text-sm font-bold text-[#FFE135]">{s.n}</span>
                  </div>
                  <h3 className="text-white font-bold mb-2">{s.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who it's for ── */}
        <section className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Slate scene="03" title="Who it's for" />
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Every side of the prep.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { t: 'DOPs', d: 'Build the package you want, badge your owned kit, send it out in minutes.' },
                { t: '1st ACs', d: 'Prep live with your DOP, add your own kit, get the LUTs and files on your phone.' },
                { t: 'Rental Houses', d: 'Clean, exact, structured lists. Real lens names. No decoding spreadsheets.' },
                { t: 'Production', d: 'A tidy professional view of what’s supplied - without the ownership noise.' },
              ].map(c => (
                <div key={c.t} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                  <h3 className="text-[#FFE135] font-bold text-sm tracking-wide uppercase mb-2">{c.t}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative px-6 pb-28">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(closest-side,rgba(255,225,53,0.07),transparent_70%)] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto text-center border border-zinc-800 rounded-3xl px-8 py-16 bg-gradient-to-b from-zinc-950 to-black shadow-[0_0_80px_-30px_rgba(255,225,53,0.15)]">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
              Free during beta.<br /><span className="text-[#FFE135]">Built by crew, for crew.</span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-xl mx-auto">
              KitLists was made in Sydney by a working 1st AC with 23 years in the camera department - on set, not in a boardroom. Join the DOPs and ACs already prepping with it.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login?signup=true" className="bg-gradient-to-b from-[#FFE135] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFC700] text-black font-bold px-10 py-4 rounded-xl text-base transition-all shadow-[0_10px_40px_-10px_rgba(255,225,53,0.5)]">
                Make a List - Free
              </Link>
              <Link href="/about" className="text-zinc-400 hover:text-white text-sm transition-colors">
                Meet the founders →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
