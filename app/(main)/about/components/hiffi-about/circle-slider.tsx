"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { slideAsset } from "./assets";
import { FlipSlideContent } from "./flip-slide-content";
import slidesData from "./slides-data.json";

type SlideData = { cover: string; flipClass: string | null };

const SLIDES = slidesData as SlideData[];

const FLIP_OUTSIDE_VARIANTS = new Set(["s6", "s7", "s8"]);

function SlideFlip({ flipClass }: { flipClass: string }) {
  return (
    <div className={cn("circle-slide-flip", flipClass)}>
      <FlipSlideContent variant={flipClass} />
    </div>
  );
}

export default function CircleSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const rotationOffsetRef = useRef(0);

  const updateSlides = useCallback((disableTransition = false) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2.2;
    const count = SLIDES.length;
    const angleStep = 360 / count;
    const rotationOffset = rotationOffsetRef.current;
    const activeIndex = activeIndexRef.current;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;

      if (disableTransition) slide.style.transition = "none";

      const angleDeg = index * angleStep + rotationOffset - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad) - slide.offsetWidth / 2;
      const y = centerY + radius * Math.sin(angleRad) - slide.offsetHeight / 2;

      slide.style.transform = `translate(${x}px, ${y}px) rotate(${angleRad + Math.PI / 2}rad)`;
      slide.classList.toggle("active", index === activeIndex);

      if (disableTransition) {
        requestAnimationFrame(() => {
          slide.style.transition = "";
        });
      }
    });
  }, []);

  const advanceSlide = useCallback(() => {
    activeIndexRef.current = (activeIndexRef.current + 1) % SLIDES.length;
    rotationOffsetRef.current -= 360 / SLIDES.length;
    updateSlides();
  }, [updateSlides]);

  useLayoutEffect(() => {
    updateSlides(true);
  }, [updateSlides]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const timer = window.setTimeout(() => {
      wrapper.style.opacity = "1";
      wrapper.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)";
      wrapper.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isVisible = !document.hidden;
    let isInViewport = true;

    const startAutoSlide = () => {
      if (intervalId || !isVisible || !isInViewport) return;
      intervalId = setInterval(advanceSlide, 2400);
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
    <div className="circle-slider-position">
      <div ref={containerRef} className="circle-slider-container">
        <div
          ref={wrapperRef}
          className="circle-slider-wrapper"
          style={{
            opacity: 0,
            transform: "translate3d(0, 0, 0) scale3d(0.6, 0.6, 1)",
          }}
        >
          {SLIDES.map((slide, index) => {
            const flipOutside = slide.flipClass ? FLIP_OUTSIDE_VARIANTS.has(slide.flipClass) : false;

            return (
              <div
                key={`${slide.cover}-${slide.flipClass}-${index}`}
                ref={(node) => {
                  slideRefs.current[index] = node;
                }}
                className="circle-slide"
              >
                <div className="circle-slide-content">
                  <div className="circle-slide-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slideAsset(slide.cover)} alt="" loading="lazy" className="image-cover" />
                  </div>
                  {slide.flipClass && !flipOutside ? <SlideFlip flipClass={slide.flipClass} /> : null}
                </div>
                {slide.flipClass && flipOutside ? <SlideFlip flipClass={slide.flipClass} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
