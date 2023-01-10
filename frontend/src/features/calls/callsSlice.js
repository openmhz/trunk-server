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
  sortComparer: (a, b) => a.time.localeCompare(b.time),
})

const initialState = {
    loading: false,
    data: callsAdapter.getInitialState(),
    oldestCallTime: now,
    newestCallTime: now,
  }

  function buildUrlParams(a) {
    return Object.keys(a).map(function(k) {
         return encodeURIComponent(k) + '=' + encodeURIComponent(a[k])
     }).join('&')
   }

  function buildCallUrl(shortName,filterType=0,filterGroupId=false, filterTalkgroups=false,filterDate=false, date=false, direction=false,filterStarred=false) {
      var params = {};
      var url = "";
  
  
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

export const getCalls = createAsyncThunk(
  'calls/getCalls',
  async({shortName,filterType=0,filterGroupId=false, filterTalkgroups=false, filterStarred=false }) => {
    const url = buildCallUrl(shortName, filterType, filterGroupId,filterTalkgroups, filterStarred);
    const res = await fetch(url).then(
      (data) => data.json()
    )
    return res;
  })

export const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {},
  extraReducers: {
    [getCalls.pending]: (state) => {
      state.loading = true;
    },
    [getCalls.fulfilled]: (state, {payload}) => {
      state.loading = false;
      state.data = callsAdapter.setAll(state.data, payload.calls)
      state.newestCallTime = new Date(payload.calls[0].time)
      state.oldestCallTime = new Date(payloads.calls[payloads.calls.length-1].time)
    },
    [getCalls.rejected]: (state) => {
      state.loading = false;
    }
  }
})

export const callsReducer = callsSlice.reducer;
