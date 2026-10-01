"use client";

import Link from "next/link";
import CircleSlider from "./circle-slider";
import Navbar from "./navbar";
import "./hero.css";

function DecorativeDots() {
  return (
    <div className="flex w-[min(520px,92vw)] flex-col items-center gap-3" aria-hidden>
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="flex w-full items-center justify-between">
          {Array.from({ length: 26 }).map((__, index) => (
            <span
              key={index}
              className="h-1 w-1 shrink-0 rounded-full bg-[#D6F4F4] opacity-80"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section
      className="about-hero-sc w-screen min-w-full"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDFBFB 48%, #F6F3F4 100%)",
      }}
    >
      <div className="relative z-30 w-full max-w-[836px] px-6 pt-6 md:px-8">
        <Navbar />
      </div>

      <CircleSlider />

      <div className="about-hero-text">
        <h1 className="max-w-[500px] bg-gradient-to-b from-[#FF8A96] to-[#FF2D3D] bg-clip-text text-[clamp(2.75rem,9.3vw,4.875rem)] font-extrabold leading-[0.95] tracking-[-3px] text-transparent">
          Music&apos;s
          <br />
          Social Media
        </h1>

        <p className="mt-[18px] text-[clamp(1rem,2.4vw,1.25rem)] font-medium text-[#181818]">
          Built for Creators. Powered by Fans.
        </p>

        <Link
          href="/signup"
          className="mt-[28px] inline-flex h-9 w-[130px] items-center justify-center rounded-full border border-[#B9A8AA] bg-white/90 text-sm text-[#222222] transition-colors duration-200 hover:border-[#FF2D3D] hover:bg-[#FF2D3D] hover:text-white"
        >
          Join Hiffi
        </Link>
      </div>

      <div className="about-hero-mask" aria-hidden />

      <div className="relative z-30 mt-auto flex w-full justify-center pb-10 pt-6">
        <DecorativeDots />
      </div>
    </section>
  );
}
