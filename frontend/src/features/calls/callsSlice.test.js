import {
  callsReducer, addCall, playedCall, addStar, removeStar, getCalls, getOlderCalls, MAX_LIVE_CALLS,
} from './callsSlice';

const mkCall = (n, extra = {}) => ({
  _id: 'c' + String(n).padStart(5, '0'),
  // later n => newer time
  time: new Date(Date.UTC(2024, 0, 1) + n * 1000).toISOString(),
  len: 5,
  star: 0,
  ...extra,
});

const run = (state, ...actions) => actions.reduce((s, a) => callsReducer(s, a), state);

describe('callsSlice live cap', () => {
  it('caps live addCall at 500, keeping the newest', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    for (let i = 1; i <= MAX_LIVE_CALLS + 20; i++) state = callsReducer(state, addCall(mkCall(i)));
    expect(state.data.ids).toHaveLength(MAX_LIVE_CALLS);
    expect(state.data.ids[0]).toBe(mkCall(MAX_LIVE_CALLS + 20)._id);
    expect(state.data.entities[mkCall(1)._id]).toBeUndefined();
    expect(state.data.entities[mkCall(21)._id]).toBeDefined();
  });

  it('never evicts a protected (selected/playing) call', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    const protectedId = mkCall(1)._id;
    for (let i = 1; i <= MAX_LIVE_CALLS + 20; i++) state = callsReducer(state, addCall(mkCall(i), [protectedId]));
    expect(state.data.ids).toHaveLength(MAX_LIVE_CALLS);
    expect(state.data.entities[protectedId]).toBeDefined();
    // the oldest unprotected ones were dropped instead
    expect(state.data.entities[mkCall(2)._id]).toBeUndefined();
  });

  it('does not trim when older calls are paged in', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    const calls = [];
    for (let i = 1; i <= MAX_LIVE_CALLS + 50; i++) calls.push(mkCall(i));
    state = run(state, getOlderCalls.fulfilled({ calls }, 'r', undefined));
    expect(state.data.ids).toHaveLength(MAX_LIVE_CALLS + 50);
  });
});

describe('callsSlice stars', () => {
  it('merges the server star count without dropping client fields', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    const call = mkCall(1, { star: 1 });
    state = run(state, addCall(call), playedCall(call._id));
    expect(state.data.entities[call._id].played).toBe(true);

    state = callsReducer(state, addStar.fulfilled({ call: { ...call, star: 2 } }, 'r', call._id));
    expect(state.data.entities[call._id].star).toBe(2);
    expect(state.data.entities[call._id].played).toBe(true);
    expect(state.starredByMe[call._id]).toBe(true);

    state = callsReducer(state, removeStar.fulfilled({ call: { ...call, star: 1 } }, 'r', call._id));
    expect(state.data.entities[call._id].star).toBe(1);
    expect(state.data.entities[call._id].played).toBe(true);
    expect(state.starredByMe[call._id]).toBeUndefined();
  });
});

describe('callsSlice failed fetch', () => {
  it('keeps the existing list and records an error', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    state = run(state, addCall(mkCall(1)), addCall(mkCall(2)));
    state = callsReducer(state, getCalls.pending('req1', {}));
    expect(state.loading).toBe(true);
    state = callsReducer(state, getCalls.rejected(new Error('Server error 500 while loading calls'), 'req1', {}));
    expect(state.loading).toBe(false);
    expect(state.data.ids).toHaveLength(2);
    expect(state.error.message).toMatch(/500/);
    expect(state.error.source).toBe('getCalls');
  });

  it('clears the error after a successful fetch', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    state = run(state,
      getCalls.pending('r1', {}),
      getCalls.rejected(new Error('boom'), 'r1', {}),
      getCalls.pending('r2', {}),
      getCalls.fulfilled({ calls: [mkCall(1)] }, 'r2', {}));
    expect(state.error).toBeNull();
    expect(state.data.ids).toHaveLength(1);
  });

  it('ignores a superseded getCalls response', () => {
    let state = callsReducer(undefined, { type: '@@init' });
    state = run(state,
      getCalls.pending('r1', {}),
      getCalls.pending('r2', {}),
      getCalls.fulfilled({ calls: [mkCall(1)] }, 'r1', {}));
    expect(state.data.ids).toHaveLength(0);
    expect(state.loading).toBe(true);
  });
});

describe('getCalls thunk response validation', () => {
  const origFetch = global.fetch;
  afterEach(() => { global.fetch = origFetch; });

  const dispatchWith = async (response) => {
    global.fetch = jest.fn().mockResolvedValue(response);
    const getState = () => ({
      callPlayer: { shortName: 'x', filterType: 0, filterTalkgroups: [] },
      calls: { oldestCallTime: 0, newestCallTime: 0 },
    });
    return getCalls({})(jest.fn(), getState, undefined);
  };

  it('rejects a 500 instead of throwing in the reducer', async () => {
    const result = await dispatchWith({ ok: false, status: 500, json: async () => ({ error: 'x' }) });
    expect(result.type).toBe(getCalls.rejected.type);
    expect(result.error.message).toMatch(/500/);
  });

  it('rejects a 200 without a calls array', async () => {
    const result = await dispatchWith({ ok: true, status: 200, json: async () => ({}) });
    expect(result.type).toBe(getCalls.rejected.type);
  });

  it('fulfils a good response', async () => {
    const result = await dispatchWith({ ok: true, status: 200, json: async () => ({ calls: [] }) });
    expect(result.type).toBe(getCalls.fulfilled.type);
  });
});
