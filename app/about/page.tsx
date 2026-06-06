import Image from "next/image"
import NavBar from "@/app/components/NavBar"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">

        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#FFE135] mb-4">About us</p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
            Built by crew,<br />for crew.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            KitLists is based in Sydney, Australia - founded by husband and wife Charlie and Lee Whitaker, who bring 23 years of camera department experience and 22 years of SaaS and software products.
          </p>
        </div>

        <div className="space-y-10">

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">The origin story</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                It started simply enough - a basic form to capture gear requirements from a DOP and send to the rental house. But camera department prep is never simple.
              </p>
              <p>
                What began as a jotform quickly became a sprawling workflow of hidden options, multiple pickers, checkboxes and unwritten rules. It was time to build something better. Not just for us - for the whole film family.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Charlie Whitaker</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                Charlie has worked in the camera department for 23 years, beginning his career in the UK film industry before relocating to Sydney in 2011. Since then he has worked as a 1st Assistant Camera and Focus Puller across major Hollywood features, internationally acclaimed TV series, and hundreds of commercials, short films and music videos.
              </p>
              <p>
                He brings a wealth of on-set prep experience, an obsession with clean builds and a deep understanding of what DOPs and rental houses actually need.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Lee Whitaker</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                Lee has spent 22 years building and running SaaS and software businesses. She currently runs her own AI and automation consultancy, building custom tools for the recruitment industry, and is a Data Protection Officer.
              </p>
              <p>
                She brings the product, technology and data foundations that make KitLists something the industry can trust.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Our mission</h2>
            <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
              <p>
                Streamline the way camera departments prep for shoots. Save time. Keep the rental house, the DOP, the 1st AC and production in the loop - with less back and forth.
              </p>
              <p>
                KitLists is free during beta. We are building this product for you and will look at all feedback to improve it. We live on the Northern Beaches of Sydney with our son, and we are genuinely proud of what this tool is becoming.
              </p>
              <p>
                If you want to get in touch, use our secure contact form once you have signed in.
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <div className="w-48 rounded-xl overflow-hidden">
              <Image
                src="/charlie-lee.jpg"
                alt="Charlie and Lee Whitaker, co-founders of KitLists"
                width={200}
                height={260}
                className="w-full object-cover"
              />
            </div>
          </div>

        </div>
      </main>


    </div>
  )
}
