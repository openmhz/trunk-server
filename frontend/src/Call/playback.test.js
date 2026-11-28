import { getNextPlayableId, isPlaybackStalled, nextAfterFailure, WATCHDOG_GRACE_MS } from './playback';

// newest first, as in the call list
const ids = ['c4', 'c3', 'c2', 'c1'];
const entities = {
  c4: { _id: 'c4' }, c3: { _id: 'c3' }, c2: { _id: 'c2' }, c1: { _id: 'c1' },
};

describe('getNextPlayableId', () => {
  it('returns the next newer call', () => {
    expect(getNextPlayableId(ids, entities, 'c2')).toBe('c3');
  });

  it('skips calls that already failed', () => {
    const e = { ...entities, c3: { _id: 'c3', failed: true } };
    expect(getNextPlayableId(ids, e, 'c2')).toBe('c4');
  });

  it('returns null at the newest call, when everything newer failed, or for an unknown call', () => {
    expect(getNextPlayableId(ids, entities, 'c4')).toBeNull();
    const e = { ...entities, c3: { _id: 'c3', failed: true }, c4: { _id: 'c4', failed: true } };
    expect(getNextPlayableId(ids, e, 'c2')).toBeNull();
    expect(getNextPlayableId(ids, entities, 'nope')).toBeNull();
  });
});

describe('nextAfterFailure', () => {
  it('advances only when autoplay is on', () => {
    expect(nextAfterFailure({ autoPlay: true, ids, entities, failedId: 'c1' })).toBe('c2');
    expect(nextAfterFailure({ autoPlay: false, ids, entities, failedId: 'c1' })).toBeNull();
  });
});

describe('isPlaybackStalled', () => {
  const base = { isPlaying: true, startedAt: 1000, lastProgressAt: 0, lengthSec: 20 };

  it('is not stalled within length + grace', () => {
    expect(isPlaybackStalled({ ...base, now: 1000 + 20000 + WATCHDOG_GRACE_MS })).toBe(false);
  });

  it('is stalled past length + grace with no progress', () => {
    expect(isPlaybackStalled({ ...base, now: 1000 + 20000 + WATCHDOG_GRACE_MS + 1 })).toBe(true);
  });

  it('counts recent progress as life', () => {
    expect(isPlaybackStalled({ ...base, lastProgressAt: 40000, now: 45000 })).toBe(false);
  });

  it('never stalls when not playing', () => {
    expect(isPlaybackStalled({ ...base, isPlaying: false, now: 10 ** 9 })).toBe(false);
  });
});
