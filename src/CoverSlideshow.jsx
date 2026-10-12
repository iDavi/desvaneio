import { useEffect, useState } from 'react';
import { coverPhotos as photos } from './coverPhotos';

export default function CoverSlideshow() {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(() => photos.map(() => false));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    // Começa apenas quando todas as fotos estão prontas; evita flashes vazios.
    if (paused || reducedMotion || !loaded.every(Boolean)) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((index) => (index + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loaded, paused, reducedMotion]);

  return (
    <div className="cover-slideshow" role="group" aria-label="Fotos de Rita Lee vestida de maga">
      {photos.map((photo, index) => (
        <img
          key={photo.file}
          className={`cover-image${active === index ? ' is-active' : ''}`}
          src={`${import.meta.env.BASE_URL}images/${photo.file}`}
          alt={photo.alt}
          aria-hidden={active !== index}
          width="367"
          height="490"
          fetchPriority={index === 0 ? 'high' : 'auto'}
          loading="eager"
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
