import { useEffect, useRef, useState } from 'react';
import phrases from './csirac-lyrics.json';
import { visibleLyrics } from './songTimeline';

export default function SongRoom() {
  const room = useRef(null);
  const audio = useRef(null);
  const userStarted = useRef(false);
  const userPaused = useRef(false);
  const [view, setView] = useState({ bar: false, top: 0, bottom: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
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
    const update = () => {
      if (!view.bar || document.hidden) { media.pause(); return; }
      if (userStarted.current && !userPaused.current && !media.ended) {
        media.play().catch(() => setPlaying(false));
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { document.removeEventListener('visibilitychange', update); media.pause(); };
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
    userStarted.current = true;
    userPaused.current = false;
    if (media.ended) media.currentTime = 0;
    try { await media.play(); setError(false); } catch { setError(true); }
  }

  const lyrics = visibleLyrics(phrases, time, reducedMotion);
  const showWords = view.bar && view.bottom > view.top;
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
      {view.bar && <div className="song-controls">
        <div className="song-controls-inner">
          <span className="song-art" aria-hidden="true" />
          <span className="song-credit"><strong>CSIRAC</strong><span>Ninajirachi</span></span>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pausar CSIRAC' : 'Tocar CSIRAC'}>
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
    </section>
  );
}
