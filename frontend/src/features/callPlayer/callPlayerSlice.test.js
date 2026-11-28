import reducer, { setFilter, setTalkgroupFilter, setAllFilter } from './callPlayerSlice';

const base = (extra = {}) => ({
  filterDate: false, filterType: 0, filterTalkgroups: [], filterGroupId: false,
  filterStarred: false, filterCallId: false, shortName: 'sys', ...extra,
});

describe('callPlayerSlice setFilter', () => {
  it('keeps the same references when nothing changed', () => {
    const s1 = reducer(undefined, setFilter(base()));
    const s2 = reducer(s1, setFilter(base()));
    expect(s2).toBe(s1); // immer returns the same state when nothing was assigned
    expect(s2.filterTalkgroups).toBe(s1.filterTalkgroups);
  });

  it('keeps the talkgroups reference for an equal list', () => {
    const s1 = reducer(undefined, setFilter(base({ filterType: 2, filterTalkgroups: [1, 2] })));
    const s2 = reducer(s1, setFilter(base({ filterType: 2, filterTalkgroups: [1, 2] })));
    expect(s2.filterTalkgroups).toBe(s1.filterTalkgroups);
  });

  it('keeps filterDate false (not 0) when there is no date', () => {
    const s = reducer(undefined, setFilter(base()));
    expect(s.filterDate).toBe(false);
  });

  it('applies real changes', () => {
    const s1 = reducer(undefined, setFilter(base()));
    const s2 = reducer(s1, setFilter(base({ filterDate: 1700000000000, filterStarred: true })));
    expect(s2.filterDate).toBe(1700000000000);
    expect(s2.filterStarred).toBe(true);
  });

  it('setAllFilter / setTalkgroupFilter keep references when unchanged', () => {
    const s1 = reducer(undefined, setFilter(base()));
    const s2 = reducer(s1, setAllFilter());
    expect(s2.filterTalkgroups).toBe(s1.filterTalkgroups);
    const s3 = reducer(s2, setTalkgroupFilter([5]));
    const s4 = reducer(s3, setTalkgroupFilter([5]));
    expect(s4.filterTalkgroups).toBe(s3.filterTalkgroups);
  });
});
