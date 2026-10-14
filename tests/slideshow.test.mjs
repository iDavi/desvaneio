import test from 'node:test';
import assert from 'node:assert/strict';
import { coverPhotos } from '../src/coverPhotos.js';
import { nextPhoto } from '../src/slideshow.js';

test('only the four selected portraits animate', () => {
  assert.deepEqual(coverPhotos.filter(p => p.animateEyes).map(p => p.file), [
    'cover.jpg', 'rita-lee-maga.jpg',
    'rita-lee-flor-vermelha.jpg', 'rita-lee-sorriso-aberto.jpg',
  ]);
});

test('active mouse chooses only animated portraits without repeating; idle includes every other photo', () => {
  for (let current = 0; current < coverPhotos.length; current++) {
    for (const active of [false, true]) {
      const seen = new Set();
      for (let i = 0; i < 100; i++) seen.add(nextPhoto(coverPhotos, current, active, () => i / 100));
      assert.deepEqual([...seen], coverPhotos.flatMap((photo, index) =>
        index !== current && (!active || photo.animateEyes) ? [index] : []));
    }
  }
});
