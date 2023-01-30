import {
    createSlice,
    createEntityAdapter,
    createSelector,
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
const now = new Date();

export const callsAdapter = createEntityAdapter({
  selectId: (call) => call._id,
  sortComparer: (a, b) => b.time.localeCompare(a.time),
})

const initialState = {
    loading: false,
    data: callsAdapter.getInitialState(),
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
  
      const {shortName,filterType,filterGroupId, filterTalkgroups, filterStarred, filterDate} = getState().callPlayer; 
  
      if ((typeof direction === 'string') && (typeof date === 'number')) {
          url = url + '/' + direction;
          params["time"] = date;
      } else {
        if (filterDate){
          url = url + '/older'
          params["time"] = filterDate;
        }
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

export const addStar = createAsyncThunk(
  'calls/addStar',
  async(callId,{getState, requestIdleCallback}) => {
    const url = process.env.REACT_APP_BACKEND_SERVER + "/add_star/" + callId
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "{}"
    
  }).then(
    (data) => data.json()
  )
  return res;
  }
)

export const removeStar = createAsyncThunk(
  'calls/removeStar',
  async(callId,{getState, requestIdleCallback}) => {
    const url = process.env.REACT_APP_BACKEND_SERVER + "/remove_star/" + callId
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "{}"
    
  }).then(
    (data) => data.json()
  )
  return res;
  }
)

export const getCalls = createAsyncThunk(
  'calls/getCalls',
  async({},{getState, requestId}) => {
    const state = getState()
    const {loading,oldestCallTime, newestCallTime} = getState().calls;
    const url = buildCallUrl(getState);
    const res = await fetch(url).then(
      (data) => data.json()
    )
    return res;
  })

  export const getOlderCalls = createAsyncThunk(
    'calls/getOlderCalls',
    async({},{getState, requestId} ) => {
      const {loading,oldestCallTime, newestCallTime} = getState().calls;
      const url = buildCallUrl(getState,"older",oldestCallTime.getTime());
      const res = await fetch(url).then(
        (data) => data.json()
      )
      return res;
    })

    export const getNewerCalls = createAsyncThunk(
      'calls/getNewerCalls',
      async({},{getState, requestId} ) => {
        const {loading,oldestCallTime, newestCallTime} = getState().calls;
        const url = buildCallUrl(getState,"newer",newestCallTime.getTime());
        const res = await fetch(url).then(
          (data) => data.json()
        )
        return res;
      })

export const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    addCall: (state, action) => {
      const call = {...action.payload, played: false}
      state.data = callsAdapter.addOne(state.data, call)
    },
    playedCall: (state,action) => {
      state.data = callsAdapter.updateOne(state.data,{id: action.payload, changes: {played: true}});
    }
  },
  extraReducers: {
    [getCalls.pending]: (state) => {
      state.loading = true;
    },
    [getCalls.rejected]: (state) => {
      state.loading = false;
    },
    [getCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      const calls = payload.calls.map( (call) => ({...call, played: false}));
      state.data = callsAdapter.setAll(state.data, calls)
      if (state.data && (state.data.ids.length > 0)) {
        const first = state.data.ids[0]
        const firstTime = state.data.entities[first].time;
        const last = state.data.ids[state.data.ids.length-1];
        const lastTime = state.data.entities[last].time;
        state.newestCallTime = new Date(firstTime)
        state.oldestCallTime = new Date(lastTime)
      }
    },
    [getOlderCalls.pending]: (state) => {
      state.loading = true;
    },
    [getOlderCalls.rejected]: (state) => {
      state.loading = false;
    }, 
    [getOlderCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      const calls = payload.calls.map( (call) => ({...call, played: false}));
      state.data = callsAdapter.addMany(state.data, calls)
      if (state.data && (state.data.ids.length > 0)) {
        const first = state.data.ids[0]
        const firstTime = state.data.entities[first].time;
        const last = state.data.ids[state.data.ids.length-1];
        const lastTime = state.data.entities[last].time;
        state.newestCallTime = new Date(firstTime)
        state.oldestCallTime = new Date(lastTime)
      }
    },
    [getNewerCalls.pending]: (state) => {
      state.loading = true;
    },
    [getNewerCalls.rejected]: (state) => {
      state.loading = false;
    }, 
    [getNewerCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      const calls = payload.calls.map( (call) => ({...call, played: false}));
      state.data = callsAdapter.addMany(state.data, calls)
      if (state.data && (state.data.ids.length > 0)) {
        const first = state.data.ids[0]
        const firstTime = state.data.entities[first].time;
        const last = state.data.ids[state.data.ids.length-1];
        const lastTime = state.data.entities[last].time;
        state.newestCallTime = new Date(firstTime)
        state.oldestCallTime = new Date(lastTime)
      }
    },
    [addStar.fulfilled]: (state, {payload}) => {
      state.data.entities[payload.call._id] = payload.call;
    },
    [removeStar.fulfilled]: (state, {payload}) => {
      state.data.entities[payload.call._id] = payload.call;
    }
  }
})
export const { addCall, playedCall } = callsSlice.actions
export const callsReducer = callsSlice.reducer;
