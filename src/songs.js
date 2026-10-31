// Pick once when SongRoom mounts; playback and scroll keep the same track.
export function chooseSong(songs, random = Math.random) {
  return songs[Math.floor(random() * songs.length)];
}
