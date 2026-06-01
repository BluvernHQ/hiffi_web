"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Navbar from "./components/navbar";
import About from "./components/about";
import WhyHiffiExists from "./components/why-hiffi-exists";
import ForFans from "./components/for-fans";
import JoinMovement from "./components/join-movement";

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const foregroundContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const whyHiffiSectionRef = useRef<HTMLElement>(null);
  const forFansSectionRef = useRef<HTMLElement>(null);
  const joinMovementSectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const scroller = document.querySelector<HTMLElement>("#main-content");

      if (
        !sectionRef.current ||
        !foregroundContainerRef.current ||
        !overlayRef.current ||
        !heroTextRef.current ||
        !aboutSectionRef.current ||
        !whyHiffiSectionRef.current ||
        !forFansSectionRef.current ||
        !joinMovementSectionRef.current ||
        !scroller
      )
        return;

      const PIN_DISTANCE = foregroundContainerRef.current.offsetHeight;
      const ABOUT_REVEAL_DISTANCE = 500;

      // Initial states
      gsap.set(foregroundContainerRef.current, { autoAlpha: 0, yPercent: 100 });
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(aboutSectionRef.current, { opacity: 0 });

      // Hero scroll-pinned timeline
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            scroller,
            start: "top top",
            end: `+=${PIN_DISTANCE}`,
            scrub: true,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        .to(overlayRef.current, { opacity: 1, ease: "none" }, 0)
        .to(heroTextRef.current, { opacity: 0, ease: "none" }, 0)
        .to(foregroundContainerRef.current, { autoAlpha: 1, yPercent: 0, ease: "none" }, 0);

      // Keep foreground visible while about section is in view
      ScrollTrigger.create({
        trigger: sectionRef.current,
        scroller,
        start: "top top",
        endTrigger: joinMovementSectionRef.current,
        end: "bottom bottom",
        onEnter: () => gsap.set(foregroundContainerRef.current, { autoAlpha: 1 }),
        onEnterBack: () => gsap.set(foregroundContainerRef.current, { autoAlpha: 1 }),
        onLeaveBack: () => gsap.set(foregroundContainerRef.current, { autoAlpha: 0 }),
        invalidateOnRefresh: true,
      });

      // Pin About section, then fade in during the pin
      gsap.to(aboutSectionRef.current, {
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: aboutSectionRef.current,
          scroller,
          start: "top top",
          end: `+=${ABOUT_REVEAL_DISTANCE}`,
          scrub: true,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: false,
        },
      });

    },
    { dependencies: [], scope: rootRef }
  );

  return (
    <div ref={rootRef} className="bg-black">
      <section ref={sectionRef} className="relative h-screen">
        <Navbar />
        <Image src="/homeBackground.png" alt="Background" fill priority className="object-cover z-0" />
        <div ref={overlayRef} className="absolute inset-0 bg-black z-[5]" />
        <div
          ref={heroTextRef}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-full grid grid-cols-12 text-center z-10"
        >
          <h1 className="col-span-10 col-start-2 text-[clamp(4rem,8vw,10rem)] font-semibold leading-[0.85] tracking-tighter text-black">
            BUILT FOR THE NEXT
          </h1>
          <h1 className="col-span-12 text-[clamp(5rem,14vw,14rem)] font-bold leading-none text-[#ED1C2F]">
            WAVE
          </h1>
        </div>
      </section>

      <section ref={aboutSectionRef} className="min-h-screen bg-black">
        <About />
      </section>

      <section ref={whyHiffiSectionRef} className="bg-black">
        <WhyHiffiExists />
      </section>

      <section ref={forFansSectionRef} className="bg-black">
        <ForFans />
      </section>

      <section ref={joinMovementSectionRef} className="bg-black">
        <JoinMovement />
      </section>

      <div
        ref={foregroundContainerRef}
        className="fixed bottom-0 left-0 w-full h-1/2 overflow-hidden z-20 pointer-events-none"
      >
        <Image src="/homeForeground.png" alt="Foreground" fill priority className="object-cover object-top z-30" />
      </div>
    </div>
  );
}