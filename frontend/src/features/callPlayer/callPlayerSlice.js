import { createSlice } from '@reduxjs/toolkit'
const now = new Date();
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
  currentCallId: false,
  live: false
}

export const callPlayerSlice = createSlice({
  name: 'callPlayer',
  initialState,
  reducers: {
    setCurrentCallId: (state, action) => {
      state.currentCallId = action.payload;
    },
    setCallTime: (state, action) => {
      state.newestCallTime = action.payload;
      state.oldestCallTime = action.payload;
    },
    setFilter: (state,action) => {
      var filter={};
      state.live = !action.payload.live ? state.live : action.payload.live;
      state.filterStarred = !action.payload.filterStarred ? false : action.payload.filterStarred;
      state.filterType = !action.payload.filterType ? 0 : action.payload.filterType;
      state.filterTalkgroups = !action.payload.filterTalkgroups ? [] : action.payload.filterTalkgroups;
      state.filterGroupId = !action.payload.filterGroupId ? false : action.payload.filterGroupId;
      state.filterDate = !action.payload.filterDate ? 0 : action.payload.filterDate;
    },
    setLive: (state,action) => {
      state.live = action.payload;
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
export const { setCurrentCallId, setCallTime, setFilter, setLive, setShortName, setDateFilter, setStarredFilter, setAllFilter, setGroupFilter, setTalkgroupFilter } = callPlayerSlice.actions

export default callPlayerSlice.reducer



