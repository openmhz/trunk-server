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
    setFilter: (state,action) => {
      var filter={};
      state.live = !action.payload.live ? state.live : action.payload.live;
      state.filterStarred = !action.payload.filterStarred ? false : action.payload.filterStarred;
      state.filterType = !action.payload.filterType ? 0 : action.payload.filterType;
      state.filterTalkgroups = !action.payload.filterTalkgroups ? [] : action.payload.filterTalkgroups;
      state.filterGroupId = !action.payload.filterGroupId ? false : action.payload.filterGroupId;
      state.filterDate = !action.payload.filterDate ? 0 : action.payload.filterDate;
      state.filterCallId = !action.payload.filterCallId ? false : action.payload.filterCallId;
      state.shortName = !action.payload.shortName ? state.shortName : action.payload.shortName;
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
      state.filterTalkgroups = [];
      state.filterGroupId = 0;
    },
    setGroupFilter: (state, action) => {
      state.filterType = 1;
      state.filterTalkgroups = [];
      state.filterGroupId = action.payload;
    },
    setTalkgroupFilter: (state, action) => {
      state.filterType = 2;
      state.filterTalkgroups = action.payload;
      state.filterGroupId = 0;
    },

  },
})

// Action creators are generated for each case reducer function
export const { setCurrentCallId, setCallTime, setFilter, setLive, setCenterCall, setBackgroundAutoplay, setBuildingPlaylist, setPlaylist, removeFromPlaylist, addToPlaylist, setShortName, setDateFilter, setStarredFilter, setAllFilter, setGroupFilter, setTalkgroupFilter } = callPlayerSlice.actions

export default callPlayerSlice.reducer



