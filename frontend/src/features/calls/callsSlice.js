import {
    createSlice,
    createEntityAdapter,
    createSelector
  } from '@reduxjs/toolkit'
  
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
            /*query: () => ({
                url: `/test/calls`,
                method: "GET"
              }),*/
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

  /*
export const {selectAll: selectAllCalls}  = callsAdapter.getSelectors((state) =>  {
    return state.api}
    );*/

