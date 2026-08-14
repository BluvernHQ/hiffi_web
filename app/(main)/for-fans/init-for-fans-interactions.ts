/** JoyJam for-fans 3D card carousel — archive carousel-js */
export function initFanHeroCarousel(root: ParentNode): () => void {
  const carousel = root.querySelector<HTMLElement>(".fan-hero-sc .carousel, .carousel");
  if (!carousel || carousel.dataset.ffCarouselReady === "true") return () => {};
  carousel.dataset.ffCarouselReady = "true";

  const cards = Array.from(carousel.querySelectorAll<HTMLElement>(":scope > .card"));
  const total = cards.length;
  if (!total) return () => {};

  let angle = 0;
  let radius = 0;
  let baseAngles: number[] = [];
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  // Desktop only — mobile stays still unless user drags
  const desktopMq = window.matchMedia("(min-width: 992px)");
  let autoRotate = desktopMq.matches;
  let autoDirection = 0.1;
  let raf = 0;
  let visible = true;
  let running = false;
  let resizeTimer = 0;

  const setup = () => {
    const card = cards[0];
    const cardWidth = card.offsetWidth;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const style = getComputedStyle(carousel);
    const gapRaw = style.columnGap || style.gap || "1.2rem";
    const gapVal = parseFloat(gapRaw) || 1.2;
    const spacing = gapRaw.includes("rem") ? gapVal : Math.max(0.85, Math.min(1.6, gapVal / rem));
    const radiusInPx = cardWidth / 2 / Math.tan(Math.PI / total);
    radius = (radiusInPx * spacing) / rem;
    baseAngles = cards.map((_, i) => (360 / total) * i);
  };

  const onDesktopChange = () => {
    autoRotate = desktopMq.matches && !isDragging;
    if (!desktopMq.matches) velocity = 0;
  };

  const paint = () => {
    cards.forEach((card, i) => {
      card.style.transform = `rotateY(${baseAngles[i] + angle}deg) translateZ(${radius}rem)`;
    });
  };

  const animate = () => {
    raf = 0;
    if (!visible) {
      running = false;
      return;
    }

    if (!isDragging) {
      if (autoRotate && desktopMq.matches) {
        angle += autoDirection;
      } else if (desktopMq.matches) {
        angle += velocity;
        velocity *= 0.9;
        if (Math.abs(velocity) < 0.05) {
          autoDirection = velocity > 0 ? 0.1 : -0.1;
          velocity = 0;
          autoRotate = true;
        }
      }
    }

    paint();
    running = true;
    raf = requestAnimationFrame(animate);
  };

  const startLoop = () => {
    if (running || !visible) return;
    running = true;
    raf = requestAnimationFrame(animate);
  };

  const stopLoop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onDragStart = (x: number) => {
    isDragging = true;
    autoRotate = false;
    startX = x;
    lastX = x;
    lastTime = performance.now();
  };

  const onDragMove = (x: number) => {
    if (!isDragging) return;
    const deltaX = x - startX;
    angle += deltaX * 0.3;
    const now = performance.now();
    const dt = now - lastTime || 1;
    velocity = ((x - lastX) / dt) * 10;
    lastX = x;
    lastTime = now;
    startX = x;
  };

  const onDragEnd = () => {
    isDragging = false;
    if (!desktopMq.matches) {
      velocity = 0;
      autoRotate = false;
      return;
    }
    if (Math.abs(velocity) < 0.1) velocity = autoDirection;
    autoRotate = true;
  };

  const onMouseDown = (e: MouseEvent) => onDragStart(e.clientX);
  const onMouseMove = (e: MouseEvent) => onDragMove(e.clientX);
  const onTouchStart = (e: TouchEvent) => onDragStart(e.touches[0].clientX);
  const onTouchMove = (e: TouchEvent) => onDragMove(e.touches[0].clientX);
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setup, 150);
  };

  carousel.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onDragEnd);
  carousel.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onDragEnd);
  window.addEventListener("resize", onResize);
  desktopMq.addEventListener("change", onDesktopChange);

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startLoop();
      else stopLoop();
    },
    { rootMargin: "20% 0px", threshold: 0 },
  );
  io.observe(carousel);

  const onVis = () => {
    if (document.hidden) stopLoop();
    else if (visible) startLoop();
  };
  document.addEventListener("visibilitychange", onVis);

  setup();
  paint();
  startLoop();

  return () => {
    stopLoop();
    window.clearTimeout(resizeTimer);
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    carousel.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onDragEnd);
    carousel.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onDragEnd);
    window.removeEventListener("resize", onResize);
    desktopMq.removeEventListener("change", onDesktopChange);
    delete carousel.dataset.ffCarouselReady;
  };
}

/** Discover/Connect — drag + wheel → horizontal scroll (JoyJam track) */
export function initTabScrollTracks(root: ParentNode): () => void {
  const tracks = root.querySelectorAll<HTMLElement>(
    ".discover-sc .cs-slider-wrapper.tab-slider-s, .connect-sc .cs-slider-wrapper.tab-slider-s",
  );
  const cleanups: Array<() => void> = [];

  tracks.forEach((track) => {
    if (track.dataset.ffScrollReady === "true") return;
    track.dataset.ffScrollReady = "true";

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 6) return;
      moved = true;
      track.scrollLeft = startScroll - dx;
      if (e.cancelable) e.preventDefault();
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      // Desktop only — mobile: leave vertical page scroll alone
      if (!window.matchMedia("(min-width: 992px)").matches) return;
      if (track.scrollWidth <= track.clientWidth) return;
      const predominateY = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (!predominateY && e.deltaX === 0) return;
      const delta = predominateY ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      track.scrollLeft += delta;
      e.preventDefault();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("click", onClickCapture, true);

    cleanups.push(() => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("click", onClickCapture, true);
      delete track.dataset.ffScrollReady;
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Nested phone tag carousels inside Discover slides */
export function initNestedPhoneSliders(root: ParentNode): () => void {
  const sliders = Array.from(root.querySelectorAll<HTMLElement>("._w-tab-slider.w-slider"));
  const timers: number[] = [];
  const cleanups: Array<() => void> = [];

  sliders.forEach((slider) => {
    if (slider.dataset.ffPhoneReady === "true") return;
    slider.dataset.ffPhoneReady = "true";

    const slides = Array.from(slider.querySelectorAll<HTMLElement>("._w-tab-slide"));
    const nav = slider.querySelector<HTMLElement>("._w-tab-slider-nav");
    if (slides.length < 2) return;

    let index = 0;
    const delay = Number(slider.getAttribute("data-delay") || 4000);

    const paint = () => {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? "block" : "none";
      });
      if (nav) {
        const dots = Array.from(nav.children) as HTMLElement[];
        if (dots.length !== slides.length) {
          nav.innerHTML = "";
          slides.forEach((_, i) => {
            const dot = document.createElement("div");
            dot.className = "w-slider-dot" + (i === index ? " w-active" : "");
            dot.addEventListener("click", () => {
              index = i;
              paint();
            });
            nav.appendChild(dot);
          });
        } else {
          dots.forEach((dot, i) => dot.classList.toggle("w-active", i === index));
        }
      }
    };

    paint();
    timers.push(
      window.setInterval(() => {
        index = (index + 1) % slides.length;
        paint();
      }, delay),
    );

    const left = slider.querySelector<HTMLElement>(".w-slider-arrow-left");
    const right = slider.querySelector<HTMLElement>(".w-slider-arrow-right");
    if (left) {
      const onLeft = () => {
        index = (index - 1 + slides.length) % slides.length;
        paint();
      };
      left.addEventListener("click", onLeft);
      cleanups.push(() => left.removeEventListener("click", onLeft));
    }
    if (right) {
      const onRight = () => {
        index = (index + 1) % slides.length;
        paint();
      };
      right.addEventListener("click", onRight);
      cleanups.push(() => right.removeEventListener("click", onRight));
    }

    cleanups.push(() => {
      delete slider.dataset.ffPhoneReady;
    });
  });

  return () => {
    timers.forEach((id) => window.clearInterval(id));
    cleanups.forEach((fn) => fn());
  };
}

export function initForFansInteractions(root: ParentNode = document): () => void {
  const cleanCarousel = initFanHeroCarousel(root);
  const cleanTracks = initTabScrollTracks(root);
  const cleanPhones = initNestedPhoneSliders(root);
  const cleanWarm = warmupEngageConnect(root);
  return () => {
    cleanCarousel();
    cleanTracks();
    cleanPhones();
    cleanWarm();
  };
}

/** Decode Engage/Connect art before first scroll-in so the reveal isn't a hitch */
function warmupEngageConnect(root: ParentNode): () => void {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>(".ff-engage img, .ff-connect img"));
  const decodeAll = () => {
    imgs.forEach((img) => {
      if (!img.src) return;
      void img.decode?.().catch(() => undefined);
    });
  };

  let idleId = 0;
  if ("requestIdleCallback" in window) {
    idleId = window.requestIdleCallback(decodeAll, { timeout: 800 });
  } else {
    idleId = window.setTimeout(decodeAll, 200);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        decodeAll();
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "90% 0px", threshold: 0 },
  );
  root.querySelectorAll<HTMLElement>(".ff-engage, .ff-connect").forEach((el) => io.observe(el));

  return () => {
    io.disconnect();
    if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    else window.clearTimeout(idleId);
  };
}
