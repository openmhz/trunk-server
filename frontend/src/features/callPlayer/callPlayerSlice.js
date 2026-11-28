import { createSlice } from '@reduxjs/toolkit'
import { set } from 'date-fns';
const now = new Date().getTime();
const initialState = {
  isWaiting: false,
  shortName: "",
  byId: {},
  allIds: [],
  oldestCallTime: now,
  newestCallTime: now,
  filterType: 0,
  filterTalkgroups: [],
  filterGroupId: false,
  filterDate: false,
  filterStarred: false,
  filterCallId: false,
  currentCallId: false,
  buildingPlaylist: false,
  playlist: [],
  live: false,
  centerCall: true,
  backgroundAutoplay: false
}

// shallow array comparison, so an equal list does not replace the stored reference
export const sameNumbers = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const compareCalls = (a, b) => {
  const aTimestamp = new Date(a.time).getTime()
  const bTimestamp = new Date(b.time).getTime()
  if (aTimestamp > bTimestamp) {
    return -1
  } else {
    return 1
  }
}

export const callPlayerSlice = createSlice({
  name: 'callPlayer',
  initialState,
  reducers: {
    setCurrentCallId: (state, action) => {
      state.currentCallId = action.payload;
    },
    setFilterCallId: (state, action) => {
      state.filterCallId = action.payload;
    },
    setCallTime: (state, action) => {
      state.newestCallTime = action.payload;
      state.oldestCallTime = action.payload;
    },
    setBuildingPlaylist: (state, action) => {
      state.buildingPlaylist = action.payload;
    },
    setPlaylist: (state, action) => {
      if (Array.isArray(action.payload )) {
      state.playlist = action.payload;
      }
    },
    removeFromPlaylist: (state, action) => { 
      const call = action.payload;
      if (call) {
        const found = state.playlist.findIndex(c => c._id == call._id);
        if (found != -1) {
          state.playlist.splice(found, 1)
        }
      }
    },
    addToPlaylist: (state, action) => {
      const call = action.payload;
      const found = state.playlist.find(c => c._id == call._id);
      if (!found) {
        const newlist = [...state.playlist, call];
        state.playlist = newlist.sort(compareCalls);
      }
    },
    setFilter: (state, action) => {
      const p = action.payload;
      // Only assign values that actually changed so selectors (and the effects
      // that depend on them) keep seeing the same references.
      const assign = (key, value) => {
        if (state[key] !== value) state[key] = value;
      };
      if (p.live) assign('live', p.live);
      assign('filterStarred', p.filterStarred ? p.filterStarred : false);
      assign('filterType', p.filterType ? p.filterType : 0);
      const talkgroups = p.filterTalkgroups ? p.filterTalkgroups : [];
      if (!sameNumbers(state.filterTalkgroups, talkgroups)) state.filterTalkgroups = talkgroups;
      assign('filterGroupId', p.filterGroupId ? p.filterGroupId : false);
      assign('filterDate', p.filterDate ? p.filterDate : false);
      assign('filterCallId', p.filterCallId ? p.filterCallId : false);
      if (p.shortName) assign('shortName', p.shortName);
    },
    setLive: (state,action) => {
      state.live = action.payload;
    },
    setCenterCall: (state,action) => {
      state.centerCall = action.payload;
    },
    setBackgroundAutoplay: (state,action) => {
      state.backgroundAutoplay = action.payload;
    },
    setShortName: (state, action) => {
      state.shortName = action.payload;
    },
    setDateFilter: (state, action) => {
      state.filterDate = action.payload;
    },
    setStarredFilter: (state, action) => {
      state.filterStarred = action.payload;
    },
    setAllFilter: (state) => {
      state.filterType = 0;
      if (state.filterTalkgroups.length) state.filterTalkgroups = [];
      state.filterGroupId = false;
    },
    setGroupFilter: (state, action) => {
      state.filterType = 1;
      if (state.filterTalkgroups.length) state.filterTalkgroups = [];
      state.filterGroupId = action.payload;
    },
    setTalkgroupFilter: (state, action) => {
      state.filterType = 2;
      if (!sameNumbers(state.filterTalkgroups, action.payload)) state.filterTalkgroups = action.payload;
      state.filterGroupId = false;
    },

  },
})

// Action creators are generated for each case reducer function
export const { setCurrentCallId, setCallTime, setFilter, setLive, setCenterCall, setBackgroundAutoplay, setBuildingPlaylist, setPlaylist, removeFromPlaylist, addToPlaylist, setShortName, setDateFilter, setStarredFilter, setAllFilter, setGroupFilter, setTalkgroupFilter } = callPlayerSlice.actions

export default callPlayerSlice.reducer



