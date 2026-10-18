import { useEffect, useRef, useState } from 'react';
import phrases from './csirac-lyrics.json';
import { visibleLyrics } from './songTimeline';
import PlayPrompt from './PlayPrompt';

const CAT_CODES = [
  100, 101, 102, 103,
  200, 201, 202, 203, 204, 205, 206, 207, 208, 214, 226,
  300, 301, 302, 303, 304, 305, 307, 308,
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411,
  412, 413, 414, 415, 416, 417, 418, 429, 500, 503,
];

export default function SongRoom() {
  const room = useRef(null);
  const audio = useRef(null);
  const playButton = useRef(null);
  const userPaused = useRef(false);
  const preloadedCats = useRef(new Map());
  const [view, setView] = useState({ bar: false, cats: false, top: 0, bottom: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const check = () => {
      const element = room.current;
      const box = element.getBoundingClientRect();
      const height = window.innerHeight;
      const visible = Math.max(0, Math.min(box.bottom, height) - Math.max(box.top, 0));
      const barHeight = parseFloat(getComputedStyle(element).getPropertyValue('--song-bar-height'));
      setView({
        bar: visible >= box.height * .2,
        cats: visible >= box.height * .5,
        top: Math.max(0, box.top),
        bottom: Math.max(0, Math.min(box.bottom, height - barHeight)),
      });
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const observer = new ResizeObserver(check);
    observer.observe(document.body);
    check();
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const media = audio.current;
    const update = (event) => {
      if (event?.target?.closest?.('.song-controls')) return;
      if (!view.bar || document.hidden) { media.pause(); return; }
      if (media.paused && !userPaused.current && !media.ended) {
        media.play().catch(() => { if (media.paused) setPlaying(false); });
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    document.addEventListener('pointerdown', update);
    document.addEventListener('keydown', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      document.removeEventListener('pointerdown', update);
      document.removeEventListener('keydown', update);
      media.pause();
    };
  }, [view.bar]);

  useEffect(() => {
    if (!playing) return;
    let frame;
    const tick = () => { setTime(audio.current.currentTime); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  async function toggle() {
    const media = audio.current;
    if (!media.paused) { userPaused.current = true; media.pause(); return; }
    userPaused.current = false;
    if (media.ended) media.currentTime = 0;
    try { await media.play(); setError(false); } catch { setError(true); }
  }

  const lyrics = visibleLyrics(phrases, time, reducedMotion);
  const showWords = view.bar && view.bottom > view.top;
  const showCats = view.cats && showWords && !lyrics?.words.some(word => word.visible);

  useEffect(() => {
    if (!view.cats) return;
    const upcoming = new Set();
    for (let offset = 0; offset < 12; offset++) {
      const code = CAT_CODES[(catIndex + offset) % CAT_CODES.length];
      upcoming.add(code);
      if (!preloadedCats.current.has(code)) {
        const image = new Image();
        image.src = `https://http.cat/${code}.jpg`;
        preloadedCats.current.set(code, image);
      }
    }
    for (const code of preloadedCats.current.keys()) {
      if (!upcoming.has(code)) preloadedCats.current.delete(code);
    }
  }, [view.cats, catIndex]);

  useEffect(() => {
    if (!showCats || reducedMotion) return;
    const timer = setInterval(() => setCatIndex(index => (index + 1) % CAT_CODES.length), 350);
    return () => clearInterval(timer);
  }, [showCats, reducedMotion]);

  return (
    <section ref={room} className="song-room" aria-label="CSIRAC — Ninajirachi">
      <audio ref={audio} preload="none" src={`${import.meta.env.BASE_URL}audio/csirac.m4a`}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(audio.current.currentTime); }}
        onLoadedMetadata={() => setDuration(audio.current.duration)}
        onSeeked={() => setTime(audio.current.currentTime)} onError={() => setError(true)} />
      {showWords && <>
        <div className={`song-words${lyrics?.row ? ' is-row' : ''}`} aria-hidden="true"
          style={{ top: view.top, height: view.bottom - view.top, '--visible-height': `${view.bottom - view.top}px` }}>
          {lyrics?.words.map(word => <span key={word.id} className="song-word"
            style={lyrics.row ? { visibility: word.visible ? 'visible' : 'hidden' } : { left: `${word.position.x}%`, top: `${word.position.y}%` }}>
            {word.text}
          </span>)}
        </div>
        <p className="sr-only">{lyrics?.words.filter(word => word.visible).map(word => word.text).join(' ')}</p>
      </>}
      {showCats && <div className="song-cats" aria-hidden="true"
        style={{ top: view.top, height: view.bottom - view.top }}>
        <img src={`https://http.cat/${CAT_CODES[catIndex]}.jpg`} alt="" />
      </div>}
      {view.bar && <div className="song-controls">
        <div className="song-controls-inner">
          <span className="song-art" aria-hidden="true" />
          <span className="song-credit"><strong>CSIRAC</strong><span>Ninajirachi</span></span>
          <button ref={playButton} type="button" onClick={toggle} aria-label={playing ? 'Pausar CSIRAC' : 'Tocar CSIRAC'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <span className="song-progress" style={{ '--song-progress': `${Math.min(100, time / (duration || 201.931) * 100)}%` }}>
            <input type="range" min="0" max={duration || 201.931} step="0.1" value={time}
              aria-label="Posição da música" onChange={event => {
                const value = Number(event.target.value); audio.current.currentTime = value; setTime(value);
              }} />
          </span>
        </div>
        {error && <span className="song-error" role="status">Toque para tentar novamente.</span>}
      </div>}
      {view.bar && !playing && <PlayPrompt buttonRef={playButton} zoneTop={view.top} zoneBottom={view.bottom} reducedMotion={reducedMotion} />}
    </section>
  );
}
