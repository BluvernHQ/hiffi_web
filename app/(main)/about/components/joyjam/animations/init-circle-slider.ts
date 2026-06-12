type CircleSliderCleanup = () => void;

export function initCircleSlider(container?: Element | null): CircleSliderCleanup {
  const root = container ?? document.querySelector(".circle-slider-container");
  if (!root) return () => {};

  const slides = root.querySelectorAll<HTMLElement>(".circle-slide");
  if (!slides.length) return () => {};

  let activeIndex = 0;
  let rotationOffset = 0;
  let autoSlideInterval: ReturnType<typeof setInterval> | null = null;
  let isVisible = !document.hidden;
  let isInViewport = true;

  const updateSlides = (disableTransition = false) => {
    const containerRect = root.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const radius = Math.min(containerRect.width, containerRect.height) / 2.2;
    const count = slides.length;
    const angleStep = 360 / count;

    slides.forEach((slide, i) => {
      if (disableTransition) slide.style.transition = "none";

      const angleDeg = i * angleStep + rotationOffset - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad) - slide.offsetWidth / 2;
      const y = centerY + radius * Math.sin(angleRad) - slide.offsetHeight / 2;

      slide.style.transform = `translate(${x}px, ${y}px) rotate(${angleRad + Math.PI / 2}rad)`;
      slide.classList.toggle("active", i === activeIndex);

      if (disableTransition) {
        requestAnimationFrame(() => {
          slide.style.transition = "";
        });
      }
    });
  };

  const startAutoSlide = () => {
    if (autoSlideInterval || !isVisible || !isInViewport) return;
    autoSlideInterval = setInterval(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      rotationOffset -= 360 / slides.length;
      updateSlides();
    }, 2400);
  };

  const stopAutoSlide = () => {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      activeIndex = (activeIndex + 1) % slides.length;
      rotationOffset -= 360 / slides.length;
      updateSlides();
      stopAutoSlide();
      startAutoSlide();
    } else if (e.key === "ArrowLeft") {
      activeIndex = (activeIndex - 1 + slides.length) % slides.length;
      rotationOffset += 360 / slides.length;
      updateSlides();
      stopAutoSlide();
      startAutoSlide();
    }
  };

  const onVisibilityChange = () => {
    isVisible = !document.hidden;
    if (isVisible && isInViewport) startAutoSlide();
    else stopAutoSlide();
  };

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isInViewport = entry.isIntersecting;
      if (isInViewport && isVisible) startAutoSlide();
      else stopAutoSlide();
    },
    { threshold: 0.1 }
  );

  const resizeObserver = new ResizeObserver(() => updateSlides(true));

  requestAnimationFrame(() => {
    updateSlides(true);
    startAutoSlide();
  });

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  visibilityObserver.observe(root);
  resizeObserver.observe(root);

  return () => {
    stopAutoSlide();
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    visibilityObserver.disconnect();
    resizeObserver.disconnect();
  };
}

export function initHeroEntrance(root: ParentNode) {
  const wrapper = root.querySelector<HTMLElement>(".circle-slider-wrapper");
  if (!wrapper) return;

  wrapper.style.opacity = "0";
  wrapper.style.transform = "translate3d(0, 0, 0) scale3d(0.6, 0.6, 1)";

  window.setTimeout(() => {
    wrapper.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    wrapper.style.opacity = "1";
    wrapper.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)";
  }, 50);
}
