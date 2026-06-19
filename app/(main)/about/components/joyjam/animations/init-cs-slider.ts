type StepValues = {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
};

type SliderConfig = {
  id: string;
  step: Record<string, StepValues>;
  visible?: number;
  clickToTop?: boolean;
};

type DragState = {
  deltaX: number;
  animate: boolean;
};

const CONFIG_URL = "/joyjam/sections/cs-slider-config.json";
const OFFSCREEN_CLASS = "cs-slide-offscreen";
const DRAG_START_PX = 8;
const DRAG_ROTATE_FACTOR = 22;

let configCache: SliderConfig[] | null = null;
let configPromise: Promise<SliderConfig[]> | null = null;

function loadConfig(): Promise<SliderConfig[]> {
  if (configCache) return Promise.resolve(configCache);
  if (!configPromise) {
    configPromise = fetch(CONFIG_URL)
      .then((r) => r.json())
      .then((data: SliderConfig[]) => {
        configCache = data;
        return data;
      })
      .catch(() => []);
  }
  return configPromise;
}

function resolveStep(step: Record<string, StepValues>, width: number): StepValues {
  const breakpoints = Object.keys(step)
    .map((key) => ({
      min: parseInt(key.replace("min ", ""), 10),
      values: step[key],
    }))
    .sort((a, b) => b.min - a.min);

  for (const bp of breakpoints) {
    if (width >= bp.min) return bp.values;
  }

  const fallback = breakpoints[breakpoints.length - 1]?.values;
  return fallback ?? { x: -6, y: 1, rotate: -5, scale: 1 };
}

function getSlides(slider: HTMLElement): HTMLElement[] {
  return Array.from(slider.querySelectorAll<HTMLElement>(":scope > .cs-slide"));
}

function applyStackTransforms(
  slides: HTMLElement[],
  step: StepValues,
  visible: number,
  drag?: DragState,
) {
  const count = slides.length;

  slides.forEach((slide, index) => {
    const offset = count - 1 - index;
    const isTop = index === count - 1;

    if (isTop && drag) {
      const width = slide.offsetWidth || 1;
      const progress = Math.max(-1, Math.min(1, drag.deltaX / width));
      const extraRotate = progress * DRAG_ROTATE_FACTOR;

      slide.style.transition = drag.animate
        ? "transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.2s"
        : "none";
      slide.style.transform = `translateX(${drag.deltaX}px) translateY(0%) rotate(${extraRotate}deg) scale(1)`;
      slide.style.transformOrigin = "center center";
      slide.style.zIndex = String(index);
      slide.classList.remove(OFFSCREEN_CLASS);
      return;
    }

    const tx = step.x * offset;
    const ty = step.y * offset;
    const rot = step.rotate * offset;
    const scale = step.scale !== undefined ? step.scale ** offset : 1;

    slide.style.transition = "transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.2s";
    slide.style.transform = `translateX(${tx}%) translateY(${ty}%) rotate(${rot}deg) scale(${scale})`;
    slide.style.transformOrigin = "center center";
    slide.style.zIndex = String(index);
    slide.classList.toggle(OFFSCREEN_CLASS, offset >= visible);
  });

  const wrapper = slides[0]?.closest<HTMLElement>("[cs-slider-id]");
  const dots = wrapper?.querySelectorAll<HTMLElement>(".cs-dot");
  if (dots && dots.length > 0) {
    const topIndex = count - 1;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === Math.min(topIndex, dots.length - 1));
    });
  }
}

function sendTopCardToBack(slider: HTMLElement) {
  const slides = getSlides(slider);
  const top = slides[slides.length - 1];
  if (!top || slides.length < 2) return;
  slider.insertBefore(top, slides[0]);
}

function bringSlideToTop(slider: HTMLElement, slide: HTMLElement) {
  slider.appendChild(slide);
}

function initDragStack(
  slider: HTMLElement,
  getStep: () => StepValues,
  visible: number,
  update: () => void,
) {
  let isPointerDown = false;
  let isDragging = false;
  let suppressClick = false;
  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let activePointerId: number | null = null;

  const renderDrag = (animate: boolean) => {
    const slides = getSlides(slider);
    applyStackTransforms(slides, getStep(), visible, { deltaX, animate });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    deltaX = 0;
    activePointerId = e.pointerId;
    slider.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isPointerDown || activePointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!isDragging) {
      if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
      isDragging = true;
    }

    deltaX = dx;
    renderDrag(false);

    if (isDragging && e.cancelable) {
      e.preventDefault();
    }
  };

  const finishDrag = (e: PointerEvent) => {
    if (!isPointerDown || activePointerId !== e.pointerId) return;

    isPointerDown = false;
    activePointerId = null;

    if (slider.hasPointerCapture(e.pointerId)) {
      slider.releasePointerCapture(e.pointerId);
    }

    if (isDragging) {
      suppressClick = true;
      sendTopCardToBack(slider);
      deltaX = 0;
      update();
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }

    isDragging = false;
  };

  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointermove", onPointerMove);
  slider.addEventListener("pointerup", finishDrag);
  slider.addEventListener("pointercancel", finishDrag);

  return {
    isSuppressingClick: () => suppressClick,
    cleanup: () => {
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", finishDrag);
      slider.removeEventListener("pointercancel", finishDrag);
    },
  };
}

function initSliderInstance(wrapper: HTMLElement, config: SliderConfig) {
  const slider = wrapper.querySelector<HTMLElement>(".cs-slider");
  if (!slider || slider.dataset.csSliderReady === "true") return () => {};

  const visible = config.visible ?? 3;
  const slides = getSlides(slider);

  const getStep = () => resolveStep(config.step, window.innerWidth);

  const update = () => {
    applyStackTransforms(getSlides(slider), getStep(), visible);
  };

  update();

  const onResize = () => update();
  window.addEventListener("resize", onResize);

  const cleanups: Array<() => void> = [];
  const drag = initDragStack(slider, getStep, visible, update);
  cleanups.push(drag.cleanup);

  if (config.clickToTop) {
    slides.forEach((slide) => {
      const onClick = () => {
        if (drag.isSuppressingClick()) return;
        bringSlideToTop(slider, slide);
        update();
      };
      slide.addEventListener("click", onClick);
      cleanups.push(() => slide.removeEventListener("click", onClick));
    });
  }

  const prevBtn = wrapper.querySelector<HTMLElement>(".cs-slider-button-prev");
  const nextBtn = wrapper.querySelector<HTMLElement>(".cs-slider-button-next");

  if (prevBtn) {
    const onPrev = () => {
      const current = getSlides(slider);
      const first = current[0];
      if (first) {
        slider.appendChild(first);
        update();
      }
    };
    prevBtn.addEventListener("click", onPrev);
    cleanups.push(() => prevBtn.removeEventListener("click", onPrev));
  }

  if (nextBtn) {
    const onNext = () => {
      sendTopCardToBack(slider);
      update();
    };
    nextBtn.addEventListener("click", onNext);
    cleanups.push(() => nextBtn.removeEventListener("click", onNext));
  }

  slider.dataset.csSliderReady = "true";

  return () => {
    window.removeEventListener("resize", onResize);
    cleanups.forEach((fn) => fn());
    delete slider.dataset.csSliderReady;
    slides.forEach((slide) => {
      slide.style.transform = "";
      slide.style.zIndex = "";
      slide.classList.remove(OFFSCREEN_CLASS);
    });
  };
}

export function initCsSliders(root: ParentNode): () => void {
  const wrappers = root.querySelectorAll<HTMLElement>("[cs-slider-id]");
  if (wrappers.length === 0) return () => {};

  let disposed = false;
  const instanceCleanups: Array<() => void> = [];

  loadConfig().then((configs) => {
    if (disposed) return;

    wrappers.forEach((wrapper) => {
      const id = wrapper.getAttribute("cs-slider-id");
      const config = configs.find((c) => c.id === id);
      if (!config) return;
      instanceCleanups.push(initSliderInstance(wrapper, config));
    });
  });

  return () => {
    disposed = true;
    instanceCleanups.forEach((fn) => fn());
  };
}
