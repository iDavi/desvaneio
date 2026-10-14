import { useEffect, useRef, useState } from 'react';
import { coverPhotos as photos } from './coverPhotos';
import EyePhoto from './EyePhoto';

export default function CoverSlideshow({ visible = true }) {
  const pointerHistory = useRef(null);
  const [active, setActive] = useState(() => Math.floor(Math.random() * photos.length));
  const [loaded, setLoaded] = useState(() => photos.map(() => false));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if(paused || reducedMotion || !visible) pointerHistory.current=null;
  }, [paused,reducedMotion,visible]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    // Começa apenas quando todas as fotos estão prontas; evita flashes vazios.
    if (paused || reducedMotion || photos.length < 2 || !loaded.every(Boolean)) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        const step = 1 + Math.floor(Math.random() * (photos.length - 1));
        setActive((index) => (index + step) % photos.length);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loaded, paused, reducedMotion]);

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
