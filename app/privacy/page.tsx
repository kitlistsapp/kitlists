export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="px-6 py-5 flex items-center justify-between">
        <a href="/" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign in</a>
          <a href="/login?signup=true" className="bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Sign up</a>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">

        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#FFE135] mb-4">Privacy</p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
            Your data.<br />Protected.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            KitLists is built on the principle that your data belongs to you. We collect only what is needed to run the service, store it securely in Australia, and never sell it to anyone.
          </p>
        </div>

        <div className="space-y-10">

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Data storage and security</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                All KitLists data is stored in a secure, enterprise-grade database hosted in Sydney, Australia. Your gear lists, profile information and account details never leave Australian infrastructure.
              </p>
              <p>
                We use industry-standard encryption for data in transit and at rest, secure authentication with hashed passwords, and role-based access controls so only you can see your data.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">AI features</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                Where KitLists uses AI features, they exist only to help you build and manage your kit lists more efficiently. AI is never used to analyse, profile or share your personal data.
              </p>
              <p>
                Your data is not used to train any AI models - ever. When AI features are used, only the minimum context needed to complete the task is sent, and nothing is retained beyond that interaction.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">What we collect</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>We collect only what is needed to provide the service:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Name and email address to create and manage your account</li>
                <li>Profile information you choose to add (phone, company, address)</li>
                <li>Gear lists, lens selections and equipment notes you create</li>
                <li>Usage data to improve the product (no third-party tracking)</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Your rights</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                KitLists complies with the Australian Privacy Principles (APPs) under the Privacy Act 1988. You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Know how your information is used and disclosed</li>
                <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
              </ul>
              <p>
                For the full framework, see the <a href="https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-quick-reference" target="_blank" rel="noopener noreferrer" className="text-[#FFE135] hover:underline">Australian Privacy Principles quick reference</a>.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Overseas disclosure</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                In limited circumstances, data may be processed by overseas service providers (for example, email delivery). Where this occurs, we take reasonable steps to ensure those providers meet standards consistent with the Australian Privacy Principles under APP 8.
              </p>
              <p>
                We do not sell, rent or trade your personal information to any third party.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Data protection</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                KitLists co-founder Lee Whitaker holds a certified Data Protection Officer qualification. Privacy is built into how we design and operate this product - not added as an afterthought.
              </p>
            </div>
          </div>

          <div>
            <p className="text-zinc-600 text-sm">Dated: June 2026</p>
          </div>

        </div>
      </main>


    </div>
  )
}
