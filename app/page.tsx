import Image from "next/image"
import { Play } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-red-500/30 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Image 
            src="/hiffi_logo.png" 
            alt="Hiffi Logo" 
            width={40} 
            height={40} 
            className="object-contain"
          />
          <Image 
            src="/hiffi_work_red.png" 
            alt="Hiffi" 
            width={120} 
            height={40} 
            className="h-7 w-auto object-contain"
          />
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="relative px-6 pt-16 pb-24 md:px-12 md:pt-32 md:pb-40 overflow-hidden max-w-7xl mx-auto w-full">
          <div className="relative z-10">
            <div className="max-w-4xl">
              <h1 className="text-[12vw] md:text-[8rem] font-black tracking-tighter leading-[0.85] mb-8">
                Hiffi is<br />
                <span className="text-[#ff1f1f]">
                  streaming<br />soon
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-md leading-relaxed font-medium">
                A streaming platform for creators and fans to discover videos and music-style content.
              </p>
            </div>
          </div>

          {/* Abstract Illustration - Matching the capsules in the image */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden hidden md:block">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[120%] rotate-[10deg] opacity-80">
               <div className="flex gap-6 justify-end">
                  {/* Column 1 */}
                  <div className="flex flex-col gap-6 mt-40">
                    <div className="w-24 h-64 rounded-full bg-[#111] border border-white/5"></div>
                    <div className="w-24 h-80 rounded-full bg-gradient-to-b from-red-600/20 to-transparent border border-red-500/20"></div>
                  </div>
                  {/* Column 2 */}
                  <div className="flex flex-col gap-6 mt-10">
                    <div className="w-24 h-96 rounded-full bg-gradient-to-b from-[#111] to-[#050505] border border-white/5"></div>
                    <div className="w-24 h-64 rounded-full bg-[#111] border border-white/5"></div>
                  </div>
                  {/* Column 3 - Featured with Play Icon */}
                  <div className="flex flex-col gap-6 mt-32">
                    <div className="w-24 h-48 rounded-full bg-[#111] border border-white/5"></div>
                    <div className="w-24 h-80 rounded-full bg-[#111] border border-white/10 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-red-600/10 opacity-50"></div>
                      <div className="bg-white/5 p-4 rounded-full backdrop-blur-sm border border-white/10">
                        <Play className="w-8 h-8 fill-white/20 text-white/20" />
                      </div>
                    </div>
                    <div className="w-24 h-56 rounded-full bg-gradient-to-b from-[#111] to-transparent border border-white/5"></div>
                  </div>
                  {/* Column 4 */}
                  <div className="flex flex-col gap-6 mt-0">
                    <div className="w-24 h-72 rounded-full bg-[#111] border border-white/5"></div>
                    <div className="w-24 h-96 rounded-full bg-[#111] border border-white/5"></div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <section className="bg-[#0f0f0f] py-16 px-6 border-y border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed font-bold tracking-tight">
              Hiffi is a streaming platform where creators share videos and music-style content for their audiences.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-3 gap-16 md:gap-8">
            <div className="space-y-4">
              <h3 className="text-[#ff1f1f] text-xs font-black uppercase tracking-[0.2em]">For Creators</h3>
              <p className="text-2xl font-bold leading-tight">
                Showcase your videos and connect with your audience
              </p>
            </div>
            <div className="space-y-4 md:border-l md:border-white/10 md:pl-12">
              <h3 className="text-[#ff1f1f] text-xs font-black uppercase tracking-[0.2em]">For Fans</h3>
              <p className="text-2xl font-bold leading-tight">
                Watch and support your favorite creators' content
              </p>
            </div>
            <div className="space-y-4 md:border-l md:border-white/10 md:pl-12">
              <h3 className="text-[#ff1f1f] text-xs font-black uppercase tracking-[0.2em]">For Culture</h3>
              <p className="text-2xl font-bold leading-tight">
                Discover new voices and stories through streaming
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 md:py-48 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">
              We're getting Hiffi ready for what's next. Check back soon for updates.
            </h2>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 md:px-12 border-t border-white/5 max-w-7xl mx-auto w-full flex items-center justify-between text-gray-600 font-bold text-sm">
        <p>© Hiffi</p>
      </footer>
    </div>
  )
}
