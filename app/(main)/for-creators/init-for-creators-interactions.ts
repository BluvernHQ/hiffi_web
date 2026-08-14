type DefaultSliderConfig = {
  id: string;
  mode?: string;
  draggable?: boolean;
  responsive?: Array<{ min: number; group?: number }>;
};

const CONFIG_URL = "/hiffi-about/sections/fc-cs-slider-config.json";

function initFeatureTabs(root: ParentNode): () => void {
  const tabMenu = root.querySelector<HTMLElement>(".slider-tabs-menu");
  if (!tabMenu) return () => {};

  const selector = tabMenu.querySelector<HTMLElement>(".slider-tab-selector");
  const customTabs = Array.from(
    tabMenu.querySelectorAll<HTMLElement>("[slider-tab-custom]"),
  );
  const panes = Array.from(
    root.querySelectorAll<HTMLElement>(".slider-tabs-content > .slider-tab-pane"),
  );
  const originalTabs = Array.from(
    root.querySelectorAll<HTMLElement>(".slider-tabs-menu-o [slider-tab-original]"),
  );

  const updateSelectorPosition = () => {
    if (!selector) return;
    const current = tabMenu.querySelector<HTMLElement>(".slider-tab-link.active-tab");
    if (!current) return;
    selector.style.width = `${current.offsetWidth}px`;
    selector.style.height = `${current.offsetHeight}px`;
    selector.style.left = `${current.offsetLeft}px`;
    selector.style.top = `${current.offsetTop}px`;
  };

  const activate = (index: number) => {
    customTabs.forEach((tab, i) => {
      tab.classList.toggle("active-tab", i === index);
    });
    originalTabs.forEach((tab, i) => {
      tab.classList.toggle("w--current", i === index);
    });
    panes.forEach((pane, i) => {
      const on = i === index;
      pane.classList.toggle("w--tab-active", on);
      pane.style.display = on ? "block" : "none";
    });
    if (selector) {
      selector.style.transform = "scale(0.8)";
      window.setTimeout(() => {
        selector.style.transform = "scale(1)";
        updateSelectorPosition();
      }, 200);
    } else {
      updateSelectorPosition();
    }
  };

  const onClicks = customTabs.map((tab, index) => {
    const handler = () => activate(index);
    tab.addEventListener("click", handler);
    return () => tab.removeEventListener("click", handler);
  });

  activate(0);
  updateSelectorPosition();
  const onResize = () => updateSelectorPosition();
  window.addEventListener("resize", onResize);

  return () => {
    onClicks.forEach((off) => off());
    window.removeEventListener("resize", onResize);
  };
}

/** JoyJam for-creators default slider — horizontal translateX carousel */
function initDefaultCsSlider(wrapper: HTMLElement, config: DefaultSliderConfig): () => void {
  const slider = wrapper.querySelector<HTMLElement>(".cs-slider");
  if (!slider || slider.dataset.fcSliderReady === "true") return () => {};

  const slides = Array.from(slider.querySelectorAll<HTMLElement>(":scope > .cs-slide"));
  if (slides.length === 0) return () => {};

  const dotsContainer = wrapper.querySelector<HTMLElement>(".cs-dots");
  const prevButton = wrapper.querySelector<HTMLElement>(".cs-slider-button-prev");
  const nextButton = wrapper.querySelector<HTMLElement>(".cs-slider-button-next");

  let currentIndex = 0;
  let stepWidth = 0;
  let group = 1;
  let maxIndex = 0;
  let dots: HTMLElement[] = [];

  const calculateStepWidth = () => {
    const slide = slides[0];
    if (!slide) return;
    const style = getComputedStyle(slide);
    const gap = parseFloat(style.marginRight) || 0;
    stepWidth = slide.offsetWidth + gap;
  };

  const getResponsiveGroup = () => {
    if (!config.responsive?.length) return 1;
    const sorted = [...config.responsive].sort((a, b) => b.min - a.min);
    const width = window.innerWidth;
    for (const bp of sorted) {
      if (width >= bp.min) return bp.group || 1;
    }
    return 1;
  };

  const updateActiveDot = (index: number) => {
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  };

  const createDots = (count: number) => {
    if (!dotsContainer) return [];
    const existing = dotsContainer.querySelector(".cs-dot");
    const dotClass = existing ? existing.className : "cs-dot";
    dotsContainer.innerHTML = "";
    const next: HTMLElement[] = [];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("div");
      dot.className = dotClass;
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
      next.push(dot);
    }
    return next;
  };

  const goTo = (index: number) => {
    calculateStepWidth();
    group = getResponsiveGroup();
    const totalWidth = slider.scrollWidth;
    const wrapperWidth = wrapper.offsetWidth;
    maxIndex = Math.max(0, Math.ceil((totalWidth - wrapperWidth) / Math.max(1, stepWidth * group)));
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    const offset = Math.min(
      stepWidth * group * currentIndex,
      Math.max(0, totalWidth - wrapperWidth),
    );
    slider.style.transition = "transform 0.4s ease";
    slider.style.transform = `translateX(${-offset}px)`;
    updateActiveDot(currentIndex);
  };

  const updateDots = () => {
    calculateStepWidth();
    group = getResponsiveGroup();
    const totalWidth = slider.scrollWidth;
    const wrapperWidth = wrapper.offsetWidth;
    const steps = Math.max(
      1,
      Math.ceil((totalWidth - wrapperWidth) / Math.max(1, stepWidth * group)) + 1,
    );
    maxIndex = Math.max(0, steps - 1);
    dots = createDots(steps);
    updateActiveDot(Math.min(currentIndex, maxIndex));
  };

  // Horizontal row like JoyJam — clear any stack transforms from about-page collider
  slider.style.display = "flex";
  slider.style.overflow = "visible";
  slider.style.willChange = "transform";
  slides.forEach((slide) => {
    slide.style.position = "relative";
    slide.style.flex = "0 0 auto";
    slide.style.transform = "";
    slide.style.zIndex = "";
    slide.classList.remove("cs-slide-offscreen");
  });

  updateDots();
  goTo(0);

  const onResize = () => {
    updateDots();
    goTo(currentIndex);
  };
  window.addEventListener("resize", onResize);

  const onPrev = () => goTo(currentIndex - 1);
  const onNext = () => goTo(currentIndex + 1);
  prevButton?.addEventListener("click", onPrev);
  nextButton?.addEventListener("click", onNext);

  let isDragging = false;
  let isScrolling: boolean | undefined;
  let startX = 0;
  let startY = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = 0;

  const readTranslateX = () => {
    const matrix = getComputedStyle(slider).transform;
    const match = matrix.match(/matrix.*\((.+)\)/);
    if (!match) return 0;
    return parseFloat(match[1].split(", ")[4] || "0");
  };

  const onPointerDown = (e: PointerEvent) => {
    if (config.draggable === false) return;
    isDragging = true;
    isScrolling = undefined;
    startX = e.clientX;
    startY = e.clientY;
    currentTranslate = readTranslateX();
    prevTranslate = currentTranslate;
    slider.style.transition = "none";
    slider.setPointerCapture(e.pointerId);
    const tick = () => {
      if (isDragging && isScrolling === false) {
        slider.style.transform = `translateX(${currentTranslate}px)`;
        animationID = requestAnimationFrame(tick);
      }
    };
    animationID = requestAnimationFrame(tick);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    if (isScrolling === undefined) {
      isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
    }
    if (!isScrolling) {
      e.preventDefault();
      currentTranslate = prevTranslate + deltaX;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    cancelAnimationFrame(animationID);
    if (!isDragging) return;
    isDragging = false;
    if (slider.hasPointerCapture(e.pointerId)) {
      slider.releasePointerCapture(e.pointerId);
    }
    if (!isScrolling) {
      calculateStepWidth();
      group = getResponsiveGroup();
      const moved = -currentTranslate / Math.max(1, stepWidth * group);
      goTo(Math.round(moved));
    }
  };

  if (config.draggable !== false) {
    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", onPointerUp);
    slider.addEventListener("pointercancel", onPointerUp);
  }

  slider.dataset.fcSliderReady = "true";

  return () => {
    window.removeEventListener("resize", onResize);
    prevButton?.removeEventListener("click", onPrev);
    nextButton?.removeEventListener("click", onNext);
    if (config.draggable !== false) {
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", onPointerUp);
      slider.removeEventListener("pointercancel", onPointerUp);
    }
    delete slider.dataset.fcSliderReady;
    slider.style.transform = "";
  };
}

function initNestedPhoneSliders(root: ParentNode): () => void {
  const sliders = Array.from(root.querySelectorAll<HTMLElement>("._w-tab-slider.w-slider"));
  const timers: number[] = [];
  const cleanups: Array<() => void> = [];

  sliders.forEach((slider) => {
    const mask = slider.querySelector<HTMLElement>("._w-tab-slider-mask");
    const slides = Array.from(slider.querySelectorAll<HTMLElement>("._w-tab-slide"));
    const nav = slider.querySelector<HTMLElement>("._w-tab-slider-nav");
    if (!mask || slides.length < 2) return;

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
            dot.className = "w-slider-dot" + (i === 0 ? " w-active" : "");
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
    const id = window.setInterval(() => {
      index = (index + 1) % slides.length;
      paint();
    }, delay);
    timers.push(id);

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
  });

  return () => {
    timers.forEach((id) => window.clearInterval(id));
    cleanups.forEach((fn) => fn());
  };
}

export function initForCreatorsInteractions(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  cleanups.push(initFeatureTabs(root));
  cleanups.push(initNestedPhoneSliders(root));

  let cancelled = false;
  fetch(CONFIG_URL)
    .then((r) => r.json())
    .then((configs: DefaultSliderConfig[]) => {
      if (cancelled) return;
      configs.forEach((config) => {
        if (config.mode && config.mode !== "default") return;
        const wrapper = root.querySelector<HTMLElement>(`[cs-slider-id="${config.id}"]`);
        if (!wrapper) return;
        cleanups.push(initDefaultCsSlider(wrapper, config));
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    cleanups.forEach((fn) => fn());
  };
}
