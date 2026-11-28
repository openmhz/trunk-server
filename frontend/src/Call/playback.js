// Pure helpers for the playback queue, kept free of React so they can be unit tested.

// Extra time, on top of a call's length, allowed before an unresponsive call is treated as failed.
export const WATCHDOG_GRACE_MS = 10000;

// The call list is ordered newest first, so the "next" call to play is the next
// newer one: the closest lower index that has not already failed.
// Returns the id, or null when there is nothing left to play.
export function getNextPlayableId(ids, entities, currentId) {
  if (!ids || !entities) return null;
  const currentIndex = ids.indexOf(currentId);
  if (currentIndex <= 0) return null;
  for (let i = currentIndex - 1; i >= 0; i--) {
    const call = entities[ids[i]];
    if (call && !call.failed) return ids[i];
  }
  return null;
}

// True when a call that should be playing has made no progress for longer than its
// length plus the grace period. `startedAt` is when it was started, `lastProgressAt`
// the last time audio advanced (0 when it never did); both are epoch milliseconds.
export function isPlaybackStalled({ isPlaying, startedAt, lastProgressAt, now, lengthSec }) {
  if (!isPlaying) return false;
  const since = Math.max(startedAt || 0, lastProgressAt || 0);
  if (!since) return false;
  const allowedMs = (Number(lengthSec) || 0) * 1000 + WATCHDOG_GRACE_MS;
  return (now - since) > allowedMs;
}

// What to do when a call has failed or finished: play the next call, or stop.
export function nextAfterFailure({ autoPlay, ids, entities, failedId }) {
  if (!autoPlay) return null;
  return getNextPlayableId(ids, entities, failedId);
}
