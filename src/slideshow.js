export function nextPhoto(photos, current, mouseActive, random = Math.random) {
  const candidates = photos.flatMap((photo, index) =>
    index !== current && (!mouseActive || photo.animateEyes) ? [index] : []);
  return candidates.length ? candidates[Math.floor(random() * candidates.length)] : current;
}
