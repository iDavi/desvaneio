import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const RAINBOW = ['#ff6363', '#ffae50', '#fff451', '#5aff65', '#5ffaff', '#9aaeff', '#ec90ff'];
const CLICKS = [
  'click!!', 'click!!!!!', 'click!!1', 'click!!', 'CLICK!!!', 'click!!',
  'click!?!', 'click!!', 'click!!!!!!', 'click!!', 'click!!1', 'click!!!',
  'click!!', 'CLICK!!', 'click!!!!!', 'click!!', 'click!!!1', 'click!!',
];
const KEY_DELAYS = [92, 48, 71, 43, 118, 36, 58, 29, 47, 65, 34, 27];
const BURSTS = [1, .72, .84, 1.18, .68, .91, .63, 1.05];
const LINE_PAUSES = [360, 95, 70, 510, 120, 55, 280, 75, 420, 65, 180, 570];

export default function PlayPrompt({ buttonRef, zoneTop, zoneBottom, reducedMotion }) {
  const [position, setPosition] = useState(null);
  const [typing, setTyping] = useState({ line: 0, chars: 0 });
  const [colorStep, setColorStep] = useState(0);

  useEffect(() => {
    const click = CLICKS[typing.line % CLICKS.length];
    const isTyping = typing.chars < click.length;
    const delay = reducedMotion ? 700
      : isTyping
        ? typing.line === 0 && typing.chars === 0 ? 240
          : Math.round(KEY_DELAYS[(typing.line * 3 + typing.chars) % KEY_DELAYS.length] * BURSTS[typing.line % BURSTS.length])
        : LINE_PAUSES[typing.line % LINE_PAUSES.length];
    const timer = setTimeout(() => setTyping(({ line, chars }) =>
      reducedMotion || chars >= CLICKS[line % CLICKS.length].length
        ? { line: line + 1, chars: 0 }
        : { line, chars: chars + 1 }), delay);
    return () => clearTimeout(timer);
  }, [typing, reducedMotion]);

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
    const mobile = width <= 680;
    const endX = mobile ? centerX - 5 : centerX - radiusX - 7;
    const endY = mobile ? centerY - radiusY - 8 : centerY - 2;
    const preferredLeft = width <= 680 ? width * .18 : width * .22;
    const labelLeft = Math.max(16, Math.min(preferredLeft, endX - labelWidth - 48));
    const startX = mobile ? centerX - 40 : labelLeft + labelWidth + 14;
    const startY = mobile
      ? zoneBottom - Math.min(105, Math.max(22, zoneBottom - zoneTop - 18))
      : labelBottom - 25;
    const maxVisibleLines = Math.max(1, Math.floor((labelBottom - zoneTop - 8) / (width <= 680 ? 18 : 20)));
    setPosition({ width, height, labelLeft, labelBottom, labelWidth, maxVisibleLines, centerX, centerY, radiusX, radiusY, startX, startY, endX, endY });
  }, [buttonRef, zoneTop, zoneBottom]);

  if (!position) return null;
  const { width, height, labelLeft, labelBottom, labelWidth, maxVisibleLines, centerX: x, centerY: y, radiusX: rx, radiusY: ry, startX: sx, startY: sy, endX: ex, endY: ey } = position;
  const circle = `M ${x-rx+3} ${y-5} C ${x-rx-4} ${y-ry+5}, ${x-9} ${y-ry-5}, ${x+10} ${y-ry+1} C ${x+rx+3} ${y-ry+7}, ${x+rx+6} ${y+ry-10}, ${x+rx-3} ${y+ry-2} C ${x+5} ${y+ry+7}, ${x-rx-9} ${y+ry-3}, ${x-rx+3} ${y-5}`;
  const arrow = width <= 680
    ? `M ${sx} ${sy} C ${sx+3} ${sy+35}, ${ex-14} ${ey-30}, ${ex} ${ey}`
    : `M ${sx} ${sy} C ${sx + Math.max(52, width*.13)} ${sy-35}, ${ex - Math.max(62, width*.17)} ${ey-105}, ${ex} ${ey}`;
  const arrowHead = width <= 680
    ? `M ${ex-12} ${ey-13} Q ${ex-3} ${ey-5}, ${ex} ${ey} Q ${ex+5} ${ey-11}, ${ex+9} ${ey-16}`
    : `M ${ex-17} ${ey-15} Q ${ex-6} ${ey-7}, ${ex} ${ey} Q ${ex-10} ${ey+3}, ${ex-20} ${ey+13}`;
  const currentVisible = reducedMotion || typing.chars > 0;
  const firstLine = Math.max(0, typing.line + Number(currentVisible) - maxVisibleLines);
  const visibleClicks = [];
  for (let line = firstLine; line < typing.line; line++) {
    visibleClicks.push({ line, text: CLICKS[line % CLICKS.length] });
  }
  if (currentVisible) {
    const click = CLICKS[typing.line % CLICKS.length];
    visibleClicks.push({ line: typing.line, text: reducedMotion ? click : click.slice(0, typing.chars) });
  }

  return createPortal(
    <div className="song-play-prompt" aria-hidden="true"
      style={{ '--prompt-arrow-color': RAINBOW[colorStep], '--prompt-circle-color': RAINBOW[(colorStep + 2) % RAINBOW.length] }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={arrow} className="song-play-prompt-arrow" />
        <path d={arrowHead} className="song-play-prompt-arrow" />
        <path d={circle} className="song-play-prompt-circle" />
        <path d={`M ${x-rx+8} ${y-ry+1} Q ${x-4} ${y-ry-10}, ${x+rx-4} ${y-ry+6}`} className="song-play-prompt-circle song-play-prompt-sketch" />
      </svg>
      <div className="song-play-prompt-note" style={{ left: labelLeft, bottom: height - labelBottom, width: labelWidth }}>
        {visibleClicks.map(({ line, text: click }) =>
          <span key={line} style={{ color: RAINBOW[(colorStep + line + 4) % RAINBOW.length] }}>{click}</span>)}
      </div>
    </div>,
    document.body,
  );
}
