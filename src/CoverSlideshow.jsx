import { useEffect, useRef, useState } from 'react';
import { coverPhotos as photos } from './coverPhotos';
import EyePhoto from './EyePhoto';
import { nextPhoto } from './slideshow';

export default function CoverSlideshow({ visible = true }) {
  const pointerHistory = useRef(null);
  const [mouseActive, setMouseActive] = useState(false);
  const [active, setActive] = useState(() => Math.floor(Math.random() * photos.length));
  const [loaded, setLoaded] = useState(() => photos.map(() => false));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (paused || reducedMotion || !visible) {
      pointerHistory.current = null;
      setMouseActive(false);
      return;
    }
    const capability = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let timer;
    const reset = () => {
      window.clearTimeout(timer);
      pointerHistory.current = null;
      setMouseActive(false);
    };
    const move = (event) => {
      if (event.pointerType !== 'mouse' || document.hidden) return;
      pointerHistory.current = { x: event.clientX, y: event.clientY, time: performance.now() };
      setMouseActive(true);
      setActive(index => photos[index].animateEyes ? index : nextPhoto(photos, index, true));
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, 3000);
    };
    const update = () => {
      window.removeEventListener('pointermove', move);
      reset();
      if (capability.matches) window.addEventListener('pointermove', move, { passive: true });
    };
    update();
    capability.addEventListener('change', update);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', move);
      capability.removeEventListener('change', update);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [paused, reducedMotion, visible]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    // Começa apenas quando todas as fotos estão prontas; evita flashes vazios.
    if (!visible || paused || reducedMotion || photos.length < 2 || !loaded.every(Boolean)) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActive((index) => nextPhoto(photos, index, mouseActive));
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loaded, paused, reducedMotion, visible, mouseActive]);

  return (
    <div className="cover-slideshow" role="group" aria-label="Fotos de Rita Lee vestida de maga">
      {photos.map((photo, index) => (
        <EyePhoto
          key={photo.file}
          photo={photo}
          pointerHistory={pointerHistory}
          active={active === index}
          enabled={visible && !paused && !reducedMotion}
          onLoad={() => setLoaded((current) => current.map((ready, i) => i === index || ready))}
        />
      ))}
      {!reducedMotion && loaded.every(Boolean) && (
        <button
          className="cover-pause"
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? 'Retomar troca de fotos' : 'Pausar troca de fotos'}
        >
          {paused ? '▶' : 'Ⅱ'}
        </button>
      )}
    </div>
  );
}
