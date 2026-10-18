// Move the photographed lids, keeping their texture and the eye corners fixed.
export function composeBlink(source, output, eye, amount) {
  output.set(source);
  if (amount <= 0) return;
  const [,, w, h] = eye.bounds;
  for (let x = 1; x < w - 1; x++) {
    let top = h, bottom = -1;
    for (let y = 1; y < h - 1; y++) {
      if (eye.weights[y * w + x] > 100) { top = Math.min(top, y); bottom = y; }
    }
    if (bottom - top < 2) continue;
    const closure = Math.min(1, amount);
    const seam = top + (bottom - top) * .8;
    const upper = top + (seam - top) * closure;
    const lower = bottom + (seam - bottom) * closure;
    for (let y = 1; y < h - 1; y++) {
      let sy;
      if (y <= upper) sy = y * top / upper;
      else if (y >= lower) sy = bottom + (y - lower) * (h - 1 - bottom) / (h - 1 - lower);
      else sy = top + (y - upper) * (bottom - top) / (lower - upper);
      const row = Math.floor(sy), mix = sy - row, k = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        output[k + c] = source[(row * w + x) * 4 + c] * (1 - mix)
          + source[((row + 1) * w + x) * 4 + c] * mix;
      }
    }
  }
}

// Sleep between blinks; request frames only for the short lid movement.
export function createBlinkMotion({draw, requestFrame, cancelFrame, setTimer, clearTimer, random = Math.random}) {
  let timer = null, frame = null, start = null, disposed = false;
  function schedule() { timer = setTimer(() => { timer = null; frame = requestFrame(tick); }, 1800 + random() * 2200); }
  function tick(time) {
    frame = null;
    if (start === null) start = time;
    const elapsed = time - start;
    if (elapsed >= 260) { draw(0); start = null; schedule(); return; }
    const t = elapsed < 90 ? elapsed / 90 : elapsed < 120 ? 1 : 1 - (elapsed - 120) / 140;
    draw(t * t * (3 - 2 * t));
    frame = requestFrame(tick);
  }
  return {
    start() { if (!disposed && timer === null && frame === null) schedule(); },
    stop() {
      if (timer !== null) clearTimer(timer);
      if (frame !== null) cancelFrame(frame);
      timer = frame = start = null; draw(0);
    },
    dispose() { this.stop(); disposed = true; },
  };
}
