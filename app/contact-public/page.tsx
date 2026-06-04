import ContactClient from '../contact/ContactClient'

export default function PublicContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="px-6 py-5 flex items-center justify-between border-b border-zinc-900">
        <a href="/" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <a href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign in</a>
      </nav>
      <ContactClient defaultEmail="" defaultName="" />
    </div>
  )
}
