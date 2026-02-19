"use client"

import { useEffect } from "react"
import Image from "next/image"

export const dynamic = "force-static"

export default function MaintenancePage() {
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#090C10] text-[#F2F6FF] font-sans selection:bg-primary/30">
      {/* Immersive background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[100px] animate-pulse" 
          style={{ animationDuration: '12s', animationDelay: '1s' }}
        />
        <div 
          className="absolute -bottom-[5%] left-[15%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[80px] animate-pulse" 
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 py-12 flex flex-col items-center text-center">
        {/* Brand Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
          <Image
            src="/appbarlogo.png"
            alt="Hiffi"
            width={180}
            height={45}
            className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(237,28,47,0.3)]"
            priority
          />
        </div>

        {/* Status Badge */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              System Maintenance
            </span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            We&rsquo;ll be back <span className="text-primary underline decoration-primary/20 underline-offset-8 italic">soon.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-lg mx-auto font-medium">
            We&rsquo;re currently optimizing Hiffi to give you the fastest streaming experience possible.
          </p>
        </div>

        <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-forwards">
          <p className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-medium">
            Building the future of streaming
          </p>
        </div>
      </div>
    </main>
  )
}
