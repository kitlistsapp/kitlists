import NavBar from '@/app/components/NavBar'

const steps = [
  {
    number: '01',
    title: 'Set up your profile',
    description: 'Before you create your first list, fill in your profile. Add your name, company, and logo — these appear on every shared list. Set your camera preferences, save your regular contacts (ACs and rental houses), and upload your LUTs so they are ready to attach.',

    tips: [
      'Your logo appears at the top of every shared gear list',
      'Saved contacts let you share with one click',
      'LUTs uploaded here can be attached to any list',
    ]
  },
  {
    number: '02',
    title: 'Create a gear list',
    description: 'Hit "+ New List" from the dashboard. Give it a project name, production company, director, rental house and shoot dates. Choose how many cameras you need. You can start from scratch or use a saved template from a previous job.',

    tips: [
      'Templates save all your gear so you can reuse it job to job',
      'Shoot dates drive the auto-archive — once the post/return date passes the list archives itself',
      'You can add extra cameras on top of a template',
    ]
  },
  {
    number: '03',
    title: 'Add your kit',
    description: 'Work through each section of your list — Camera Body, Power, Lenses, Filtration, AKS, Head & Legs, Gimbals, VTR, and Shoot Specs. Each section saves as you go. You can jump to any section directly, or use the Next button to step through them in order.',

    tips: [
      'Mark items as DOP-owned or AC-owned — this shows on the shared list',
      'Add notes to any section for the rental house or AC',
      'Shoot specs let you attach LUTs and codec details',
    ]
  },
  {
    number: '04',
    title: 'Collaborate with your 1st AC',
    description: 'Invite your focus puller directly from the list page. They will receive an email with a link to join. Once they accept, they have full edit access to the list — they can add their own kit, mark items as AC-owned, and work alongside you in real time.',

    tips: [
      'The dashboard shows "1st AC invited" on any list with a pending invite',
      'Your AC gets a dedicated invite email with an Accept button',
      'Once accepted they appear as a collaborator on the list',
    ]
  },
  {
    number: '05',
    title: 'Share your list',
    description: 'When your list is ready, hit Share. You can generate separate links for your rental house, focus puller, and production — each with the right level of detail. Send by email directly from KitLists, copy the link, or download a PDF or Excel file.',

    tips: [
      'Rental house and AC links show DOP/AC ownership labels',
      'Production links show a clean view with "Supplied" instead of ownership',
      'Sharing a list automatically moves it to Sent on your dashboard',
    ]
  },
]

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="max-w-3xl mx-auto px-4 py-12">

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">
            Getting started with Kit<span className="text-[#FFE135]">Lists</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            KitLists is built for DOPs and ACs to build, collaborate on, and share professional camera equipment lists.
            Follow these five steps to get up and running.
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-zinc-800" style={{ top: '64px', bottom: '-48px' }} />
              )}

              <div className="flex gap-6">
                {/* Step number + icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center z-10 relative">
                  <span className="text-sm font-bold text-white">{step.number.split('')[0]}{step.number.split('')[1]}</span>
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-zinc-600 font-mono">{step.number}</span>
                    <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                  </div>

                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">{step.description}</p>

                  {/* Tips */}
                  <div className="space-y-1.5">
                    {step.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#FFE135] mt-0.5 flex-shrink-0">→</span>
                        <p className="text-zinc-500 text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-zinc-800 text-center space-y-4">
          <p className="text-zinc-400 text-sm">Ready to get started?</p>
          <a href="/profile"
            className="inline-block bg-[#FFE135] hover:bg-yellow-300 text-black font-semibold px-8 py-3 rounded-lg text-sm transition-colors">
            Create my profile
          </a>
          <div className="pt-2">
            <a href="/dashboard" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
              Back to dashboard
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
