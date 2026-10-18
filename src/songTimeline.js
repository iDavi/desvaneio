// Every cue follows the media clock, including after buffering or seeking.
export function visibleLyrics(phrases, time, reducedMotion = false) {
  const index = phrases.findIndex(phrase => time >= phrase.start && time < phrase.end);
  if (index < 0) return null;
  const phrase = phrases[index];
  const row = reducedMotion || index % 3 === 1;
  return {
    index, row,
    words: phrase.words.map((word, i) => ({ ...word, id: `${index}-${i}`, visible: word.start <= time, position: wordPosition(index, i) }))
      .filter(word => row || (word.visible && time < word.end + 1.25))
      .slice(row ? 0 : -6),
  };
}

export function wordPosition(phrase, word) {
  // A shuffled 3×3 grid keeps simultaneous words apart and inside the viewport.
  const cell = (word * 4 + phrase * 7) % 9;
  const jitter = ((phrase * 13 + word * 17) % 9) - 4;
  return { x: 18 + (cell % 3) * 32 + jitter, y: 20 + Math.floor(cell / 3) * 25 - jitter };
}
