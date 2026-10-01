"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SLIDE_COUNT = 8;
const AUTO_INTERVAL_MS = 2400;

function ActiveSlideFace() {
  return (
    <>
      <div className="flex h-[70%] w-[70%] items-center justify-center rounded-full bg-[#E8E8E8]" />
      <span className="about-flip-widget absolute -left-2 top-1 text-base" aria-hidden>
        🎵
      </span>
      <span className="about-flip-widget absolute -bottom-1 -right-2 text-sm grayscale" aria-hidden>
        🤍
      </span>
      <div className="about-flip-widget absolute -bottom-3 -left-8 max-w-[9rem] rounded-full bg-[#ECECEC] px-2.5 py-1 shadow-sm">
        <p className="text-left text-[8px] leading-tight text-[#555]">
          <span className="font-semibold text-[#333]">Lara Jason:</span> You are the inspiration.
        </p>
      </div>
    </>
  );
}

export default function CircleSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const rotationOffsetRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateSlides = useCallback((disableTransition = false) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2.2;
    const angleStep = 360 / SLIDE_COUNT;
    const rotationOffset = rotationOffsetRef.current;
    const currentActive = activeIndexRef.current;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;

      if (disableTransition) {
        slide.style.transition = "none";
      }

      const angleDeg = index * angleStep + rotationOffset - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad) - slide.offsetWidth / 2;
      const y = centerY + radius * Math.sin(angleRad) - slide.offsetHeight / 2;

      slide.style.transform = `translate(${x}px, ${y}px) rotate(${angleRad + Math.PI / 2}rad)`;
      slide.dataset.active = index === currentActive ? "true" : "false";
    });

    if (disableTransition) {
      requestAnimationFrame(() => {
        slideRefs.current.forEach((slide) => {
          if (slide) slide.style.transition = "";
        });
      });
    }
  }, []);

  const advanceSlide = useCallback(() => {
    activeIndexRef.current = (activeIndexRef.current + 1) % SLIDE_COUNT;
    rotationOffsetRef.current -= 360 / SLIDE_COUNT;
    setActiveIndex(activeIndexRef.current);
    updateSlides();
  }, [updateSlides]);

  useLayoutEffect(() => {
    updateSlides(true);
  }, [updateSlides]);

  useEffect(() => {
    updateSlides();
  }, [activeIndex, updateSlides]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isVisible = !document.hidden;
    let isInViewport = true;

    const startAutoSlide = () => {
      if (intervalId || !isVisible || !isInViewport) return;
      intervalId = setInterval(advanceSlide, AUTO_INTERVAL_MS);
    };

    const stopAutoSlide = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const resizeObserver = new ResizeObserver(() => updateSlides(true));
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = entry.isIntersecting;
        if (isInViewport && isVisible) startAutoSlide();
        else stopAutoSlide();
      },
      { threshold: 0.1 }
    );
    visibilityObserver.observe(container);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && isInViewport) startAutoSlide();
      else stopAutoSlide();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    startAutoSlide();

    return () => {
      stopAutoSlide();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [advanceSlide, updateSlides]);

  return (
    <div className="about-circle-slider-position" aria-hidden>
      <div ref={containerRef} className="about-circle-slider-container">
        <div className="about-circle-slider-wrapper">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <div
              key={index}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              className={cn("about-circle-slide", index === activeIndex && "active")}
            >
              <div className="about-circle-slide-content">
                <div className="about-circle-slide-image" />
                <div className="about-circle-slide-flip">
                  <ActiveSlideFace />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
