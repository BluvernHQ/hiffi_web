export function bindDragScroll(track: HTMLElement) {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (e.pointerType === "touch") return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
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
  };

  const onPointerUp = () => {
    dragging = false;
    track.classList.remove("is-dragging");
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
  track.addEventListener("click", onClickCapture, true);

  return () => {
    track.removeEventListener("pointerdown", onPointerDown);
    track.removeEventListener("pointermove", onPointerMove);
    track.removeEventListener("pointerup", onPointerUp);
    track.removeEventListener("pointercancel", onPointerUp);
    track.removeEventListener("click", onClickCapture, true);
    track.classList.remove("is-dragging");
  };
}
