"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

function JoyJamLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 160 32" fill="none">
      <path
        d="M33.7598 0.261885C33.8509 0.356024 33.915 0.483164 33.9382 0.654669C33.956 0.786138 33.9425 0.920312 33.9074 1.04853C32.7542 5.29071 31.6537 9.54695 30.5769 13.8097C29.5681 17.8041 28.9246 22.1296 27.3456 25.94C26.4354 28.1365 24.9161 30.1849 22.761 31.1739C21.2752 31.8556 19.569 31.9886 17.9636 31.6835C14.1502 30.9585 10.9334 27.4922 10.797 23.5984L3.26836 23.5919C3.28884 27.2552 5.78187 30.7762 9.22125 32C6.61181 31.7457 4.12147 30.4197 2.44921 28.3925C0.875568 26.4848 0.167969 24.1519 0.167969 21.7259C0.167969 21.496 0.37168 21.0378 0.698264 21.0394C2.63459 21.0486 9.54514 21.0535 12.2586 21.0556C12.7425 21.0556 13.1446 21.5301 13.1079 21.7709C12.7425 24.1746 13.7088 26.7824 15.6726 28.2112C19.5787 31.0532 23.8803 28.3021 25.2287 24.2736C26.3437 20.9415 26.9306 17.3734 27.7805 13.9639C28.729 10.1588 29.7211 6.36518 30.7569 2.58288L12.6531 2.59316L10.9749 7.34119L21.8508 7.49809C21.0882 10.4797 20.3256 13.4613 19.5631 16.4423C19.299 17.4751 19.0231 18.5334 18.4114 19.4044C17.7992 20.276 16.7682 20.9333 15.7157 20.7938L18.614 9.92675C15.4188 9.9473 12.2236 9.93703 9.02831 9.89645C8.42904 9.88887 7.63521 9.72332 7.73114 9.00484C7.73814 8.9502 7.75216 8.89664 7.76832 8.84416C8.53143 6.37871 9.33981 3.92678 10.1908 1.49055C10.7221 -0.0329731 10.8499 0.0535909 12.4283 0.0503448C13.7859 0.0470986 15.1434 0.0438525 16.5015 0.0400653C21.9322 0.0265397 27.3628 0.0135551 32.7935 2.95164e-05C33.1357 -0.00105253 33.5318 0.0265397 33.7598 0.261885Z"
        fill="#FF5C01"
      />
      <path
        d="M44.8931 23.0359C41.4901 23.0359 39.2713 22.3517 38.2367 20.9832C37.3659 19.8346 37.2102 18.1744 37.7696 16.0027H43.6227C43.3802 16.9442 43.3539 17.688 43.5437 18.2341C43.8148 19.0186 44.5758 19.4109 45.8269 19.4109C47.0908 19.4109 48.0571 19.0186 48.726 18.2341C49.2021 17.6692 49.559 16.9254 49.7966 16.0027L51.5381 9.24219H57.3911L55.63 16.0777C55.0836 18.1994 54.0824 19.8344 52.6264 20.9829C50.8802 22.3517 48.3024 23.0361 44.8931 23.0359Z"
        fill="currentColor"
      />
      <path
        d="M64.848 23.0379C61.3995 23.0379 59.0389 22.3506 57.7662 20.9759C56.6409 19.7582 56.349 18.098 56.8907 15.9951C57.431 13.8987 58.5774 12.2417 60.3299 11.0239C62.311 9.64932 65.0257 8.96198 68.474 8.96191C71.9224 8.96185 74.2829 9.64919 75.5557 11.0239C76.681 12.2416 76.9736 13.8987 76.4334 15.9951C75.892 18.098 74.7449 19.7583 72.992 20.9759C71.0109 22.3505 68.2962 23.0379 64.848 23.0379ZM65.7818 19.4129C67.1947 19.4129 68.3329 19.0206 69.1963 18.2361C69.8667 17.6421 70.3452 16.862 70.5707 15.9951C70.7925 15.1355 70.7184 14.3917 70.3485 13.7638C69.8909 12.9729 68.9556 12.5775 67.5427 12.5774C66.1298 12.5773 64.9877 12.9728 64.1163 13.7638C63.4462 14.3538 62.9683 15.1309 62.744 15.9951C62.5223 16.8552 62.5956 17.6022 62.9642 18.2361C63.4295 19.0206 64.3687 19.4129 65.7818 19.4129Z"
        fill="currentColor"
      />
      <path
        d="M85.5132 22.7445H79.6602L81.3095 16.342L75.5273 9.2334H82.0125L85.0258 13.2726L90.111 9.2334H96.5961L87.1618 16.342L85.5132 22.7445Z"
        fill="currentColor"
      />
      <path
        d="M97.2658 23.0359C93.863 23.0359 91.6442 22.3517 90.6095 20.9832C89.7387 19.8346 89.583 18.1744 90.1424 16.0027H95.9955C95.7529 16.9442 95.7266 17.688 95.9165 18.2341C96.1875 19.0186 96.9485 19.4109 98.1996 19.4109C99.4635 19.4109 100.43 19.0186 101.099 18.2341C101.575 17.6692 101.932 16.9254 102.169 16.0027L103.911 9.24219H109.764L108.003 16.0777C107.456 18.1994 106.455 19.8344 104.999 20.9829C103.253 22.3517 100.675 23.0361 97.2658 23.0359Z"
        fill="currentColor"
      />
      <path
        d="M127.864 22.7437H121.933L121.19 20.5309H112.391L110.508 22.7437H104.578L116.981 9.24219H122.416L127.864 22.7437ZM120.078 17.1885L118.711 13.0929L115.226 17.1883L120.078 17.1885Z"
        fill="currentColor"
      />
      <path
        d="M155.351 22.7447H149.498L151.717 14.1295L144.267 22.7447H139.902L136.9 14.1295L134.681 22.7447H128.828L132.308 9.2334H139.26L143.084 18.8841L151.87 9.2334H158.832L155.351 22.7447Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

export default function JoyJamHeader() {
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
      <div data-animation="default" data-collapse="none" data-duration="400" role="banner" className="navbar w-nav">
        <div ref={navContainerRef} className="nav-container change" {...{ "view-item": "from-center" }}>
          <Link aria-label="JoyJam Home" href="/about" className="brand navbar-s w-inline-block w--current">
            <div className="brand-svg change w-embed">
              <JoyJamLogo />
            </div>
          </Link>

          <nav role="navigation" className="nav-menu-wrapper w-nav-menu">
            <div className="nav-menu">
              <div ref={navLinksRef} className="nav-links">
                <a aria-label="For Creators" href="#" className="nav-link w-nav-link">
                  For creators
                </a>
                <a aria-label="For Fans" href="#" className="nav-link w-nav-link">
                  For fans
                </a>
                <div data-hover="false" data-delay="0" className="nav-drop w-dropdown">
                  <div className="nav-drop-toggle w-dropdown-toggle">
                    <div className="nav-link">Partners</div>
                  </div>
                  <nav className="nav-drop-list change w-dropdown-list">
                    <a href="#" className="nav-link w-dropdown-link">
                      Sponsors
                    </a>
                  </nav>
                </div>
                <a aria-label="About" href="#" className="nav-link change w-nav-link">
                  About
                </a>
                <a aria-label="Contact Us" href="#" className="nav-link change w-nav-link">
                  Contact Us
                </a>
                <div ref={hoverLineRef} className="nav-link-hover">
                  <div className="nav-link-hover-line change" />
                  <div className="nav-link-hover-line blur" />
                </div>
              </div>

              <div className="nav-button-wrapper">
                <div className="nav-button change">
                  <div>Join the Beta</div>
                  <div aria-hidden="true" className="wave-area">
                    <div data-expand="1" className="wave-line-infinity" />
                    <div data-expand="1" className="wave-line-infinity" />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="wave-area">
            <div data-expand="1.5" className="wave-line-default navbar-s change" />
          </div>
        </div>
      </div>
    </header>
  );
}
