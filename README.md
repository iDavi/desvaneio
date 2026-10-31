# desvane.io

blog

## CSIRAC at the bottom of the blog

The index pages end with a blank `100dvh` section. When at least 20% of it enters the viewport, a fixed bottom player appears. Only its play button starts `public/audio/csirac.m4a`. Lyrics are clipped to the visible part of the blank section above the player. Leaving the section or hiding the tab pauses playback. An explicit pause remains paused on return. The source audio was extracted without re-encoding from the supplied `CSIRAC.mp4` (201.931 seconds).

`src/csirac-lyrics.json` contains 73 phrase windows and 558 word cues. Phrase anchors use the matching-duration reference at <https://lrclib.net/api/get/27537467>. Words were force-aligned locally against the supplied recording with faster-whisper `small.en`, one phrase at a time. Eight ambiguous phrases (zero-based indices 23, 36, 55, 56, 57, 58, 60, 63) use syllable-weighted estimates within those anchors. Timing is a first pass, especially for chopped vocals; edit individual `start`/`end` values to refine it.

`SongRoom` reads `audio.currentTime` rather than chaining timers, so pause, buffering, seeking, and replay do not accumulate synchronization drift. Every third phrase forms a stable row with space reserved for upcoming words. Other phrases use a shuffled grid with at most six visible words. Reduced motion always uses rows; instrumental gaps show no words. Audio uses `preload="none"` so it is not downloaded just to read the blog.

## Random song selection

`SongRoom` selects CSIRAC or When You Sleep by my bloody valentine with equal probability on mount, using `src/songs.js`. Scrolling and pausing retain the selected track. Credits, cover, audio, duration and lyric timeline all follow this choice. Reloading draws again; it can select the same track twice.

`public/audio/when-you-sleep.m4a` is the unmodified AAC stream extracted from the user-provided 251.88-second MP4 in Downloads. Its cover is a frame from that video. `src/when-you-sleep-lyrics.json` contains 27 vocal phrases; word timestamps were force-aligned locally with small.en, with proportional estimates for ambiguous alignments. These timings are an initial pass for listening review. Instrumental passages retain the existing cats.
