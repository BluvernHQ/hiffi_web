"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MOBILE_NAV_MAX_WIDTH = 991;

function useNavLinkHover(enabled: boolean) {
  const navLinksRef = useRef<HTMLDivElement>(null);
  const hoverLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const navWrapper = navLinksRef.current;
    const hoverLine = hoverLineRef.current;
    if (!navWrapper || !hoverLine) return;

    const navLinks = navWrapper.querySelectorAll<HTMLElement>(".nav-link");
    let isFirstHover = true;

    const onMouseLeave = () => {
      isFirstHover = true;
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
  }, [enabled]);

  return { navLinksRef, hoverLineRef };
}

function isMobileNav() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_NAV_MAX_WIDTH;
}

export default function HiffiHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { navLinksRef, hoverLineRef } = useNavLinkHover(!menuOpen);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuWrapperRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => el.classList.add("view"), 100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const menuWrapper = menuWrapperRef.current;
    if (!menuWrapper) return;

    const resetDesktopMenu = () => {
      setMenuOpen(false);
    };

    if (!isMobileNav()) {
      resetDesktopMenu();
    }

    const onResize = () => {
      if (!isMobileNav()) {
        resetDesktopMenu();
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen || !isMobileNav()) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const navContainer = navContainerRef.current;
      if (!navContainer) return;

      if (!navContainer.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const toggleMenu = () => {
    if (!isMobileNav()) return;
    setMenuOpen((open) => !open);
  };

  return (
    <header className="header">
      <div
        data-animation="default"
        data-collapse="none"
        data-duration="400"
        role="banner"
        className={`navbar w-nav${menuOpen ? " hiffi-nav-is-open" : ""}`}
        {...{ "navbar-element": "" }}
      >
        <div
          ref={navContainerRef}
          className="nav-container change"
          {...{ "view-item": "from-center" }}
        >
          <Link aria-label="Hiffi Home" href="/" className="brand navbar-s w-inline-block" onClick={closeMenu}>
            <div className="brand-svg change w-embed hiffi-brand-logo">
              <Image
                src="/appbarlogo.png"
                alt="Hiffi"
                width={132}
                height={32}
                className="hiffi-nav-logo-img w-auto object-contain"
                priority
              />
            </div>
          </Link>

          <nav
            ref={menuWrapperRef}
            role="navigation"
            className={`nav-menu-wrapper w-nav-menu${menuOpen ? " hiffi-nav-menu-open" : ""}`}
            {...{ "nav-menu-wrapper": "" }}
          >
            <div className="nav-menu">
              <div ref={navLinksRef} className="nav-links">
                <Link
                  aria-label="For Creators"
                  href="/creator/apply"
                  className="nav-link w-nav-link"
                  onClick={closeMenu}
                >
                  For creators
                </Link>
                <Link aria-label="For Fans" href="/signup" className="nav-link w-nav-link" onClick={closeMenu}>
                  For fans
                </Link>
                <Link
                  aria-label="About"
                  href="/about"
                  className="nav-link w-nav-link w--current"
                  {...{ "change-color": "" }}
                  onClick={closeMenu}
                >
                  About
                </Link>
                <Link
                  aria-label="Contact Us"
                  href="/support"
                  className="nav-link w-nav-link"
                  {...{ "change-color": "" }}
                  onClick={closeMenu}
                >
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
                  onClick={closeMenu}
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

          <button
            ref={toggleRef}
            type="button"
            className="nav-open-button hiffi-nav-toggle"
            data-nav-open=""
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={(event) => {
              event.stopPropagation();
              toggleMenu();
            }}
          >
            {menuOpen ? (
              <svg
                className="hiffi-nav-toggle-svg hiffi-nav-toggle-svg--close"
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 4L18 18M18 4L4 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                className="hiffi-nav-toggle-svg hiffi-nav-toggle-svg--menu"
                width="22"
                height="16"
                viewBox="0 0 22 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M5 1.75H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M1.5 8H20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 14.25H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
