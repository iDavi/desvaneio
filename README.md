# desvane.io

blog

## CSIRAC at the bottom of the blog

The index pages end with a blank `100dvh` section. Reaching the bottom attempts to play `public/audio/csirac.m4a`; browsers that require a direct gesture show a `tocar` button. Leaving the section or hiding the tab pauses playback. An explicit pause remains paused on return. The source audio was extracted without re-encoding from the supplied `CSIRAC.mp4` (201.931 seconds).

`src/csirac-lyrics.json` contains 73 phrase windows and 558 word cues. Phrase anchors use the matching-duration reference at <https://lrclib.net/api/get/27537467>. Words were force-aligned locally against the supplied recording with faster-whisper `small.en`, one phrase at a time. Eight ambiguous phrases (zero-based indices 23, 36, 55, 56, 57, 58, 60, 63) use syllable-weighted estimates within those anchors. Timing is a first pass, especially for chopped vocals; edit individual `start`/`end` values to refine it.

`SongRoom` reads `audio.currentTime` rather than chaining timers, so pause, buffering, seeking, and replay do not accumulate synchronization drift. Every third phrase forms a stable row with space reserved for upcoming words. Other phrases use a shuffled grid with at most six visible words. Reduced motion always uses rows; instrumental gaps show no words. Audio uses `preload="none"` so it is not downloaded just to read the blog.
