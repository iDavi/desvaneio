import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const RAINBOW = ['#ff6363', '#ffae50', '#fff451', '#5aff65', '#5ffaff', '#9aaeff', '#ec90ff'];
const CLICKS = [
  'click!!', 'click!!!!!', 'click!!1', 'click!!', 'click!!', 'click!!!',
  'click!!', 'click!!!!!', 'click!!', 'click!!1', 'click!!', 'click!!!',
  'click!!', 'click!!', 'click!!!!!', 'click!!', 'click!!1', 'click!!',
];

export default function PlayPrompt({ buttonRef, zoneTop, zoneBottom, reducedMotion }) {
  const [position, setPosition] = useState(null);
  const [clickCount, setClickCount] = useState(1);
  const [colorStep, setColorStep] = useState(0);

  useEffect(() => {
    if (clickCount >= CLICKS.length) return;
    const timer = setTimeout(() => setClickCount(count => count + 1), 700);
    return () => clearTimeout(timer);
  }, [clickCount]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setColorStep(step => (step + 1) % RAINBOW.length), 280);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const labelWidth = width <= 340 ? 128 : width <= 680 ? 146 : 180;
    const labelBottom = zoneBottom - 10;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radiusX = rect.width / 2 + 15;
    const radiusY = rect.height / 2 + 13;
    const endX = centerX - radiusX - 7;
    const endY = centerY - 2;
    const preferredLeft = width <= 680 ? width * .18 : width * .22;
    const labelLeft = Math.max(16, Math.min(preferredLeft, endX - labelWidth - 48));
    const startX = labelLeft + labelWidth + 14;
    const startY = labelBottom - 25;
    const maxVisibleLines = Math.max(1, Math.floor((labelBottom - zoneTop - 8) / (width <= 680 ? 17 : 20)));
    setPosition({ width, height, labelLeft, labelBottom, labelWidth, maxVisibleLines, centerX, centerY, radiusX, radiusY, startX, startY, endX, endY });
  }, [buttonRef, zoneTop, zoneBottom]);

  if (!position) return null;
  const { width, height, labelLeft, labelBottom, labelWidth, maxVisibleLines, centerX: x, centerY: y, radiusX: rx, radiusY: ry, startX: sx, startY: sy, endX: ex, endY: ey } = position;
  const circle = `M ${x-rx+3} ${y-5} C ${x-rx-4} ${y-ry+5}, ${x-9} ${y-ry-5}, ${x+10} ${y-ry+1} C ${x+rx+3} ${y-ry+7}, ${x+rx+6} ${y+ry-10}, ${x+rx-3} ${y+ry-2} C ${x+5} ${y+ry+7}, ${x-rx-9} ${y+ry-3}, ${x-rx+3} ${y-5}`;
  const arrow = width <= 680
    ? `M ${sx} ${sy} C ${sx+12} ${sy+12}, ${ex-13} ${ey-15}, ${ex} ${ey}`
    : `M ${sx} ${sy} C ${sx + Math.max(52, width*.13)} ${sy-35}, ${ex - Math.max(62, width*.17)} ${ey-105}, ${ex} ${ey}`;

  return createPortal(
    <div className="song-play-prompt" aria-hidden="true"
      style={{ '--prompt-arrow-color': RAINBOW[colorStep], '--prompt-circle-color': RAINBOW[(colorStep + 2) % RAINBOW.length] }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={arrow} className="song-play-prompt-arrow" />
        <path d={`M ${ex-17} ${ey-15} Q ${ex-6} ${ey-7}, ${ex} ${ey} Q ${ex-10} ${ey+3}, ${ex-20} ${ey+13}`} className="song-play-prompt-arrow" />
        <path d={circle} className="song-play-prompt-circle" />
        <path d={`M ${x-rx+8} ${y-ry+1} Q ${x-4} ${y-ry-10}, ${x+rx-4} ${y-ry+6}`} className="song-play-prompt-circle song-play-prompt-sketch" />
      </svg>
      <div className="song-play-prompt-note" style={{ left: labelLeft, bottom: height - labelBottom, width: labelWidth }}>
        {CLICKS.slice(0, Math.min(clickCount, maxVisibleLines)).map((click, index) =>
          <span key={index} style={{ color: RAINBOW[(colorStep + index + 4) % RAINBOW.length] }}>{click}</span>)}
      </div>
    </div>,
    document.body,
  );
}
