"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

function useNavLinkHover() {
  const navLinksRef = useRef<HTMLDivElement>(null);
  const hoverLineRef = useRef<HTMLDivElement>(null);
  const isFirstHoverRef = useRef(true);

  useEffect(() => {
    const navWrapper = navLinksRef.current;
    const hoverLine = hoverLineRef.current;
    if (!navWrapper || !hoverLine) return;

    const navLinks = navWrapper.querySelectorAll<HTMLElement>(".nav-link");
    let isFirstHover = true;

    const onMouseLeave = () => {
      isFirstHover = true;
      isFirstHoverRef.current = true;
      hoverLine.style.opacity = "0";
    };

    const onMouseEnter = (link: HTMLElement) => {
      const linkRect = link.getBoundingClientRect();
      const wrapperRect = navWrapper.getBoundingClientRect();
      const offsetLeft = linkRect.left - wrapperRect.left;
      const width = linkRect.width;

      if (isFirstHover) {
        hoverLine.style.transition = "opacity 0.3s ease, transform 0s, width 0.4s ease";
        hoverLine.style.width = `${width}px`;
        hoverLine.style.transform = `translateX(${offsetLeft}px)`;
        void hoverLine.offsetWidth;
        hoverLine.style.transition = "opacity 0.4s ease, transform 0.4s ease, width 0.4s ease";
        isFirstHover = false;
        isFirstHoverRef.current = false;
      } else {
        hoverLine.style.width = `${width}px`;
        hoverLine.style.transform = `translateX(${offsetLeft}px)`;
      }

      hoverLine.style.opacity = "1";
    };

    navWrapper.addEventListener("mouseleave", onMouseLeave);
    const handlers = Array.from(navLinks).map((link) => {
      const handler = () => onMouseEnter(link);
      link.addEventListener("mouseenter", handler);
      return { link, handler };
    });

    return () => {
      navWrapper.removeEventListener("mouseleave", onMouseLeave);
      handlers.forEach(({ link, handler }) => link.removeEventListener("mouseenter", handler));
    };
  }, []);

  return { navLinksRef, hoverLineRef };
}

export default function HiffiHeader() {
  const { navLinksRef, hoverLineRef } = useNavLinkHover();
  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => el.classList.add("view"), 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <header className="header">
      <div
        data-animation="default"
        data-collapse="none"
        data-duration="400"
        role="banner"
        className="navbar w-nav"
        {...{ "navbar-element": "" }}
      >
        <div ref={navContainerRef} className="nav-container change" {...{ "view-item": "from-center" }}>
          <Link aria-label="Hiffi Home" href="/" className="brand navbar-s w-inline-block">
            <div className="brand-svg change w-embed hiffi-brand-logo">
              <Image
                src="/appbarlogo.png"
                alt="Hiffi"
                width={132}
                height={32}
                className="h-[1.75rem] w-auto object-contain"
                priority
              />
            </div>
          </Link>

          <nav role="navigation" className="nav-menu-wrapper w-nav-menu">
            <div className="nav-menu">
              <div ref={navLinksRef} className="nav-links">
                <Link aria-label="For Creators" href="/creator/apply" className="nav-link w-nav-link">
                  For creators
                </Link>
                <Link aria-label="For Fans" href="/signup" className="nav-link w-nav-link">
                  For fans
                </Link>
                <Link aria-label="About" href="/about" className="nav-link w-nav-link w--current" {...{ "change-color": "" }}>
                  About
                </Link>
                <Link aria-label="Contact Us" href="/support" className="nav-link w-nav-link" {...{ "change-color": "" }}>
                  Contact us
                </Link>
                <div ref={hoverLineRef} className="nav-link-hover">
                  <div className="nav-link-hover-line change" />
                  <div className="nav-link-hover-line blur" />
                </div>
              </div>

              <div className="nav-button-wrapper">
                <Link
                  href="/signup"
                  aria-label="Sign up for Hiffi"
                  className="nav-button change hiffi-nav-cta"
                  {...{ "wave-parent-infinity": "" }}
                >
                  <div>Sign Up</div>
                  <div aria-hidden="true" className="wave-area">
                    <div data-expand="1" className="wave-line-infinity" />
                    <div data-expand="1" className="wave-line-infinity" />
                  </div>
                </Link>
              </div>
            </div>
          </nav>

          <div wave-parent-default="" className="wave-area">
            <div data-expand="1.5" change-color="" className="wave-line-default navbar-s change" />
          </div>
        </div>
      </div>
    </header>
  );
}
