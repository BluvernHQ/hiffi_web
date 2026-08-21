
(() => {
  const BASE_W = 1600;
  const BASE_H = 900;
  const body = document.body;
  const current = Number(body.dataset.slide || 1);
  function fit() {
    const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    document.documentElement.style.setProperty('--scale', String(scale));
  }
  function go(delta) {
    const target = current + delta;
    if (target >= 1 && target <= 10) window.location.href = `slide-${target}.html`;
  }
  fit();
  window.addEventListener('resize', fit, {passive:true});
  window.addEventListener('orientationchange', fit, {passive:true});
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); go(1); }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); go(-1); }
    if (event.key === 'Home') window.location.href = 'slide-1.html';
    if (event.key === 'End') window.location.href = 'slide-10.html';
  });
  let startX = null;
  document.addEventListener('touchstart', (event) => { startX = event.changedTouches[0].clientX; }, {passive:true});
  document.addEventListener('touchend', (event) => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 55) go(delta < 0 ? 1 : -1);
    startX = null;
  }, {passive:true});
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      console.error(`Missing local image: ${image.getAttribute('src')}`);
    }, {once:true});
  });
})();
