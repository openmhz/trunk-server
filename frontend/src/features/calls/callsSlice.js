import {
    createSlice,
    createEntityAdapter,
    createAsyncThunk
  } from '@reduxjs/toolkit'
  
  /*
  import { apiSlice } from '../api/apiSlice'

// in order for the initial fetch to happen this call needs to be made in index.js
// store.dispatch(extendedApiSlice.endpoints.getCalls.initiate())

  export const callsAdapter = createEntityAdapter({
    selectId: (call) => call._id,
    sortComparer: (a, b) => a.time.localeCompare(b.time),
  })

  const initialState = callsAdapter.getInitialState()

  export const extendedApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
      getCalls: builder.query({
            query: ({shortName,filterType=0,filterCode=0}) => ({
              url: `/${shortName}/calls`,
              method: "GET", 
              params: { filterType, filterCode },
            }),
        transformResponse: responseData => {
            responseData = responseData.calls;
          return callsAdapter.setAll(initialState, responseData)
        }
      })
    })
  })
  

  // from tutorials: https://redux.js.org/tutorials/essentials/part-8-rtk-query-advanced#transforming-responses
  export const { useGetCallsQuery } = extendedApiSlice
// Calling `someEndpoint.select(someArg)` generates a new selector that will return
// the query result object for a query with those parameters.
// To generate a selector for a specific query argument, call `select(theQueryArg)`.
// In this case, the users query has no params, so we don't pass anything to select()
export const selectCallsResult = extendedApiSlice.endpoints.getCalls.select({"shortName":"test"})

const selectCallsData = createSelector(
  selectCallsResult,
  (callsResult) => {
    return callsResult.data
  }
)

export const { selectAll: selectAllCalls, selectById: selectCallById } = callsAdapter.getSelectors(state => { 
    return selectCallsData(state) ?? initialState
})
*/
const now = new Date().getTime();

export const callsAdapter = createEntityAdapter({
  selectId: (call) => call._id,
  sortComparer: (a, b) => b.time.localeCompare(a.time),
})

// Maximum number of calls kept in memory while listening live.
export const MAX_LIVE_CALLS = 500;

const STARRED_KEY = "openmhz-starred-calls";

const loadStarred = () => {
  try {
    const raw = window.localStorage.getItem(STARRED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    return {};
  }
}

const saveStarred = (starred) => {
  try {
    const ids = Object.keys(starred).slice(-2000); // keep the stored list bounded
    const trimmed = {};
    ids.forEach((id) => { trimmed[id] = true; });
    window.localStorage.setItem(STARRED_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // storage unavailable (private mode etc.) - the in-memory state still works
  }
}

const initialState = {
    loading: false,
    error: null,        // { message, source } of the last failed fetch, cleared on the next success
    currentRequestId: null,
    data: callsAdapter.getInitialState(),
    starredByMe: loadStarred(), // call _id -> true
    oldestCallTime: now,
    newestCallTime: now
  }

  function buildUrlParams(a) {
    return Object.keys(a).map(function(k) {
         return encodeURIComponent(k) + '=' + encodeURIComponent(a[k])
     }).join('&')
   }

  function buildCallUrl(getState, direction=false, date=false) {
      var params = {};
      var url = "";
  
      const {shortName,filterType,filterGroupId, filterTalkgroups, filterStarred, filterDate, filterCallId} = getState().callPlayer; 
  
      if ((typeof direction === 'string') && (typeof date === 'number')) {
          url = url + '/' + direction;
          params["time"] = date;
      } else  if (filterCallId) {
        url = url + '/date'
        params["time"] = filterDate;
      } else if (filterDate){
          url = url + '/older'
          params["time"] = filterDate;
        }
      
      if (filterStarred) {
        params["filter-starred"] = true;
      }
      switch(filterType) {
        case 1:
        params["filter-type"] = "group";
        params["filter-code"] = filterGroupId;
        break;
        case 2:
        params["filter-type"] = "talkgroup";
        params["filter-code"] = filterTalkgroups;
        break;
        default:
        case 0:
      }
  /*
      if (this.filterCode != "") {
          params["filter-code"] = this.filterCode;
      }
      if (this.filterType == this.FilterType.Group) {
          params["filter-type"] = "group";
          params["filter-name"] = this.filterName;
      }
      if (this.filterType == this.FilterType.Talkgroup) {
          params["filter-type"] = "talkgroup";
      }
      if (this.filterType == this.FilterType.Unit) {
          params["filter-type"] = "unit";
      }
  */
    //  url = startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/calls" + url + '?' + buildUrlParams(params);
      url = process.env.REACT_APP_BACKEND_SERVER + "/" + shortName + "/calls" + url + '?' + buildUrlParams(params);
      console.log("Trying to fetch data from this url: " + url);
      return url;
  }


// Fetch JSON and make sure it is a usable response. A 500 returns JSON without
// `calls`, so a bare res.json() would blow up later inside a reducer.
const fetchCallList = async (url) => {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error("Network error while loading calls");
  }
  if (!res.ok) {
    throw new Error("Server error " + res.status + " while loading calls");
  }
  let body;
  try {
    body = await res.json();
  } catch (e) {
    throw new Error("Invalid response while loading calls");
  }
  if (!body || !Array.isArray(body.calls)) {
    throw new Error("Unexpected response while loading calls");
  }
  return body;
}

const postStar = async (path, callId) => {
  const url = process.env.REACT_APP_BACKEND_SERVER + path + callId;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: "{}"
  });
  if (!res.ok) throw new Error("Server error " + res.status + " while starring");
  const body = await res.json();
  if (!body || !body.call || !body.call._id) throw new Error("Unexpected response while starring");
  return body;
}

export const addStar = createAsyncThunk('calls/addStar', (callId) => postStar("/add_star/", callId))
export const removeStar = createAsyncThunk('calls/removeStar', (callId) => postStar("/remove_star/", callId))

export const getCalls = createAsyncThunk(
  'calls/getCalls',
  async (arg, { getState }) => fetchCallList(buildCallUrl(getState)))

export const getOlderCalls = createAsyncThunk(
  'calls/getOlderCalls',
  async (arg, { getState }) => fetchCallList(buildCallUrl(getState, "older", getState().calls.oldestCallTime)))

export const getNewerCalls = createAsyncThunk(
  'calls/getNewerCalls',
  async (arg, { getState }) => fetchCallList(buildCallUrl(getState, "newer", getState().calls.newestCallTime)))

const withPlayed = (calls) => calls.map((call) => ({ ...call, played: false }));

const updateTimes = (state) => {
  const ids = state.data.ids;
  if (ids.length > 0) {
    state.newestCallTime = new Date(state.data.entities[ids[0]].time).getTime();
    state.oldestCallTime = new Date(state.data.entities[ids[ids.length - 1]].time).getTime();
  }
}

const fail = (source) => (state, action) => {
  state.loading = false;
  state.error = { message: (action.error && action.error.message) || "Couldn't load calls", source };
}

// Drops the oldest calls beyond `max`, never touching ids listed in `keepIds`.
export const trimCalls = (state, max, keepIds) => {
  const ids = state.data.ids;
  let excess = ids.length - max;
  if (excess <= 0) return;
  const keep = new Set(keepIds.filter(Boolean));
  const remove = [];
  for (let i = ids.length - 1; i >= 0 && excess > 0; i--) {
    if (keep.has(ids[i])) continue;
    remove.push(ids[i]);
    excess--;
  }
  state.data = callsAdapter.removeMany(state.data, remove);
}

export const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    // Live call from the socket. prepare() lets callers name calls that must survive trimming
    // (the playing / selected call).
    addCall: {
      reducer: (state, action) => {
        const { call, keepIds, max } = action.payload;
        state.data = callsAdapter.addOne(state.data, { ...call, played: false });
        trimCalls(state, max, [call._id, ...keepIds]);
        if (state.data.ids.length > 0) {
          state.oldestCallTime = new Date(state.data.entities[state.data.ids[state.data.ids.length - 1]].time).getTime();
        }
      },
      prepare: (call, keepIds = [], max = MAX_LIVE_CALLS) => ({ payload: { call, keepIds, max } })
    },
    playedCall: (state,action) => {
      state.data = callsAdapter.updateOne(state.data,{id: action.payload, changes: {played: true}});
    },
    failedCall: (state, action) => {
      state.data = callsAdapter.updateOne(state.data, { id: action.payload, changes: { failed: true } });
    },
    clearCallsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: {
    [getCalls.pending]: (state, action) => {
      state.loading = true;
      state.currentRequestId = action.meta.requestId;
    },
    [getCalls.rejected]: (state, action) => {
      if (action.meta.requestId !== state.currentRequestId) return; // superseded
      fail('getCalls')(state, action);
    },
    [getCalls.fulfilled]: (state, {payload, meta}) => {
      if (meta.requestId !== state.currentRequestId) return; // a newer request owns the list
      state.loading = false;
      state.error = null;
      state.data = callsAdapter.setAll(state.data, withPlayed(payload.calls))
      updateTimes(state);
    },
    [getOlderCalls.pending]: (state) => {
      state.loading = true;
    },
    [getOlderCalls.rejected]: fail('getOlderCalls'),
    [getOlderCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      state.error = null;
      state.data = callsAdapter.addMany(state.data, withPlayed(payload.calls))
      updateTimes(state);
    },
    [getNewerCalls.pending]: (state) => {
      state.loading = true;
    },
    [getNewerCalls.rejected]: fail('getNewerCalls'),
    [getNewerCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      state.error = null;
      state.data = callsAdapter.addMany(state.data, withPlayed(payload.calls))
      updateTimes(state);
    },
    [addStar.fulfilled]: (state, {payload}) => {
      const call = payload.call;
      state.starredByMe[call._id] = true;
      saveStarred(state.starredByMe);
      const existing = state.data.entities[call._id];
      if (existing) existing.star = call.star; // keep client fields such as `played`
    },
    [removeStar.fulfilled]: (state, {payload}) => {
      const call = payload.call;
      delete state.starredByMe[call._id];
      saveStarred(state.starredByMe);
      const existing = state.data.entities[call._id];
      if (existing) existing.star = call.star;
    }
  }
})
export const { addCall, playedCall, failedCall, clearCallsError } = callsSlice.actions
export const callsReducer = callsSlice.reducer;
