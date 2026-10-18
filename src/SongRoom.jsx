import { useEffect, useRef, useState } from 'react';
import phrases from './csirac-lyrics.json';
import { visibleLyrics } from './songTimeline';

export default function SongRoom() {
  const room = useRef(null), audio = useRef(null), userPaused = useRef(false);
  const [atBottom, setAtBottom] = useState(false);
  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const check = () => {
      const box = room.current.getBoundingClientRect();
      setAtBottom(box.top <= 2 && box.bottom <= window.innerHeight + 2 && box.bottom > 0);
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
    const update = () => {
      if (!atBottom || document.hidden) { media.pause(); return; }
      setEntered(true);
      if (!userPaused.current && !media.ended) {
        // Scroll alone isn't a playback gesture in every browser. Keep a tap fallback.
        media.play().catch(() => setPlaying(false));
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { document.removeEventListener('visibilitychange', update); media.pause(); };
  }, [atBottom]);

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
  return (
    <section ref={room} className="song-room" aria-label="CSIRAC — Ninajirachi">
      <audio ref={audio} preload="none" src={`${import.meta.env.BASE_URL}audio/csirac.m4a`}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(audio.current.currentTime); }}
        onLoadedMetadata={() => setDuration(audio.current.duration)}
        onSeeked={() => setTime(audio.current.currentTime)} onError={() => setError(true)} />
      {entered && atBottom && <>
        <div className={`song-words${lyrics?.row ? ' is-row' : ''}`} aria-hidden="true">
          {lyrics?.words.map(word => <span key={word.id} className="song-word"
            style={lyrics.row ? { visibility: word.visible ? 'visible' : 'hidden' } : { left: `${word.position.x}%`, top: `${word.position.y}%` }}>
            {word.text}
          </span>)}
        </div>
        <p className="sr-only">{lyrics?.words.filter(word => word.visible).map(word => word.text).join(' ')}</p>
        <div className="song-controls">
          <span className="song-credit">CSIRAC <span>— Ninajirachi</span></span>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pausar CSIRAC' : 'Tocar CSIRAC'}>
            {playing ? 'pausar' : time >= duration && duration ? 'ouvir de novo' : 'tocar'}
          </button>
          {duration > 0 && <input type="range" min="0" max={duration} step="0.1" value={time}
            aria-label="Posição da música" onChange={event => {
              const value = Number(event.target.value); audio.current.currentTime = value; setTime(value);
            }} />}
          {error && <span role="status">Toque para tentar novamente.</span>}
        </div>
      </>}
    </section>
  );
}
