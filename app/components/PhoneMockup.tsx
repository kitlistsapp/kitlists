// Stylised phone-frame mockups of the KitLists app UI.
// Pure presentational - no client JS, safe in server components.

function Frame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-[250px] flex-shrink-0 ${className}`}>
      {/* Screen glow behind the phone */}
      <div className="absolute -inset-8 bg-[radial-gradient(closest-side,rgba(255,225,53,0.14),transparent_70%)] pointer-events-none" />
      {/* Metallic bezel */}
      <div className="relative rounded-[2.7rem] p-[3px] bg-gradient-to-b from-zinc-500 via-zinc-800 to-zinc-600 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),0_0_50px_-10px_rgba(255,225,53,0.12)]">
        <div className="rounded-[2.55rem] bg-black p-[7px]">
          <div className="h-[470px] flex flex-col rounded-[2rem] overflow-hidden bg-gradient-to-b from-zinc-950 to-black border border-zinc-900/80">
            {/* Status bar + notch */}
            <div className="relative flex items-center justify-between px-5 pt-2.5 pb-1 flex-shrink-0">
              <span className="text-[8px] font-semibold text-zinc-400">9:41</span>
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-16 h-4 rounded-full bg-black border border-zinc-900" />
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-zinc-500">5G</span>
                <div className="w-4 h-2 rounded-[3px] border border-zinc-600 relative">
                  <div className="absolute inset-[1.5px] right-[3px] bg-[#FFE135] rounded-[1px]" />
                </div>
              </div>
            </div>
            <div className="px-3.5 pb-5 pt-1.5 flex-1 flex flex-col min-h-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniNav() {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/80 mb-2.5">
      <span className="text-[11px] font-bold text-white">Kit<span className="text-[#FFE135]">Lists</span></span>
      <div className="flex items-center -space-x-1">
        <div className="w-4 h-4 rounded-full bg-[#FFE135] border border-black flex items-center justify-center"><span className="text-[6px] font-bold text-black">JS</span></div>
        <div className="w-4 h-4 rounded-full bg-blue-500 border border-black flex items-center justify-center"><span className="text-[6px] font-bold text-white">CW</span></div>
      </div>
    </div>
  )
}

function Badge({ kind }: { kind: 'dop' | 'ac' | 'supplied' }) {
  if (kind === 'dop') return <span className="text-[6px] font-bold px-1.5 py-px rounded-full bg-[#FFE135]/15 text-[#FFE135] border border-[#FFE135]/30">DOP</span>
  if (kind === 'ac') return <span className="text-[6px] font-bold px-1.5 py-px rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">AC</span>
  return <span className="text-[6px] font-bold px-1.5 py-px rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">SUPPLIED</span>
}

export function PhoneList({ className = '' }: { className?: string }) {
  const sections = [
    { name: 'Camera Body', detail: 'ALEXA 35 · 2 bodies', done: true },
    { name: 'Lenses', detail: '8 primes · 1 zoom', done: true },
    { name: 'Power', detail: '12 items', done: true },
    { name: 'Filtration', detail: '6 filters', done: true },
    { name: 'AKS', detail: '14 items', done: false },
    { name: 'Head & Legs', detail: '3 items', done: false },
  ]
  return (
    <Frame className={className}>
      <MiniNav />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[7px] tracking-[0.2em] uppercase text-zinc-600 font-semibold">Gear list</p>
        <span className="flex items-center gap-1 text-[6.5px] font-bold text-red-400"><span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />LIVE</span>
      </div>
      <p className="text-[12px] font-bold text-white leading-tight">Nightfall - TVC</p>
      <p className="text-[7.5px] text-zinc-500 mb-2">3 day shoot · Panavision Sydney</p>
      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#FFE135] to-[#FFD700]" />
        </div>
        <span className="text-[6.5px] text-zinc-500 font-semibold">4/6</span>
      </div>
      <div className="space-y-1.5">
        {sections.map(s => (
          <div key={s.name} className={`flex items-center justify-between rounded-lg px-2 py-1.5 border ${s.done ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/60 border-dashed'}`}>
            <div>
              <p className="text-[8px] font-semibold text-white">{s.name}</p>
              <p className="text-[6.5px] text-zinc-500">{s.detail}</p>
            </div>
            {s.done
              ? <span className="w-3.5 h-3.5 rounded-full bg-[#FFE135] flex items-center justify-center text-[7px] font-bold text-black">✓</span>
              : <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex items-center justify-center text-[7px] text-zinc-600">+</span>}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-2.5">
        <div className="bg-gradient-to-b from-[#FFE135] to-[#FFD700] rounded-lg py-2 text-center shadow-[0_4px_16px_-4px_rgba(255,225,53,0.5)]">
          <span className="text-[8.5px] font-bold text-black">Share list →</span>
        </div>
      </div>
    </Frame>
  )
}

export function PhoneLenses({ className = '' }: { className?: string }) {
  const lenses = [
    { name: 'Signature Prime 25mm T1.8', mfr: 'ARRI', own: 'dop' as const, added: true },
    { name: 'Signature Prime 35mm T1.8', mfr: 'ARRI', own: null, added: true },
    { name: 'Signature Prime 47mm T1.8', mfr: 'ARRI', own: null, added: true },
    { name: 'Supreme Prime 85mm T1.5', mfr: 'ZEISS', own: 'ac' as const, added: true },
    { name: 'CN-E 15.5-47mm T2.8', mfr: 'Canon', own: null, added: false },
  ]
  return (
    <Frame className={className}>
      <MiniNav />
      <p className="text-[7px] tracking-[0.2em] uppercase text-zinc-600 font-semibold mb-1.5">Lens library</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5">
        <span className="text-zinc-600 text-[8px]">⌕</span>
        <span className="text-[7.5px] text-zinc-500">Search 4,000+ lenses…</span>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {['ARRI', 'ZEISS', 'Cooke', 'Canon'].map((m, i) => (
          <span key={m} className={`text-[6.5px] font-semibold px-1.5 py-0.5 rounded-full border ${i === 0 ? 'border-[#FFE135] text-black bg-[#FFE135]' : 'border-zinc-800 text-zinc-500'}`}>{m}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {lenses.map(l => (
          <div key={l.name} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-[7.5px] font-semibold text-white truncate">{l.name}</p>
              <p className="text-[6.5px] text-zinc-500">{l.mfr}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {l.own && <Badge kind={l.own} />}
              {l.added
                ? <span className="w-3.5 h-3.5 rounded-full bg-[#FFE135]/15 border border-[#FFE135]/40 flex items-center justify-center text-[7px] text-[#FFE135]">✓</span>
                : <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex items-center justify-center text-[7.5px] text-zinc-500">+</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[6.5px] text-zinc-600 text-center mt-auto pt-2">8 lenses on this list · grouped by manufacturer</p>
    </Frame>
  )
}

export function PhoneShare({ className = '' }: { className?: string }) {
  return (
    <Frame className={className}>
      <MiniNav />
      <p className="text-[7px] tracking-[0.2em] uppercase text-zinc-600 font-semibold mb-1">Share</p>
      <p className="text-[12px] font-bold text-white mb-2.5 leading-tight">Who sees what</p>
      <div className="space-y-1.5">
        <div className="bg-zinc-900 border border-[#FFE135]/50 rounded-lg px-2 py-1.5 shadow-[0_0_14px_-4px_rgba(255,225,53,0.35)]">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[8px] font-semibold text-white">Rental House</p>
            <span className="text-[6px] font-bold text-[#FFE135]">FULL VIEW</span>
          </div>
          <div className="text-[6.5px] text-zinc-500 flex items-center gap-1">Ownership shown <Badge kind="dop" /> <Badge kind="ac" /></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[8px] font-semibold text-white">1st AC</p>
            <span className="text-[6px] font-bold text-[#FFE135]">FULL VIEW</span>
          </div>
          <p className="text-[6.5px] text-zinc-500">Full detail + LUTs &amp; files</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[8px] font-semibold text-white">Production</p>
            <span className="text-[6px] font-bold text-zinc-500">CLEAN VIEW</span>
          </div>
          <div className="text-[6.5px] text-zinc-500 flex items-center gap-1">Ownership hidden <Badge kind="supplied" /></div>
        </div>
      </div>
      <div className="mt-auto pt-2.5 grid grid-cols-2 gap-1.5">
        <div className="bg-gradient-to-b from-[#FFE135] to-[#FFD700] rounded-lg py-1.5 text-center"><span className="text-[7.5px] font-bold text-black">Email link</span></div>
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-center"><span className="text-[7.5px] font-bold text-zinc-300">PDF / Excel</span></div>
      </div>
      <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-[#FFE135] flex items-center justify-center text-[6px] font-bold text-black">✓</span>
        <p className="text-[6.5px] text-zinc-400">Sent to Panavision Sydney · just now</p>
      </div>
    </Frame>
  )
}

export default function PhoneTrio() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="hidden md:block relative -mr-10 -rotate-6 translate-y-8 scale-[0.88] opacity-80 hover:opacity-100 transition-opacity"><PhoneLenses /></div>
      <div className="relative z-10"><PhoneList /></div>
      <div className="hidden md:block relative -ml-10 rotate-6 translate-y-8 scale-[0.88] opacity-80 hover:opacity-100 transition-opacity"><PhoneShare /></div>
    </div>
  )
}
