// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createSelector} from '@reduxjs/toolkit'


// Define our single API slice object
export const apiSlice = createApi({
    // The cache reducer expects to be added at `state.api` (already default - this is optional)
    reducerPath: 'api',

    // All of our requests will have URLs starting with '/fakeApi'
    baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_BACKEND_SERVER }),
    // The "endpoints" represent operations and requests for this server
    endpoints: builder => ({
        // The `getPosts` endpoint is a "query" operation that returns data
        getGroups: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: `/${shortName}/groups` })
        }),
        getSystems: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: () => ({ url: '/systems' })
        }),
        getEvents: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: () => ({ url: '/events' }),
            transformResponse: responseData => {
                return responseData.sort(function compareFn(a, b) { if (a.createdAt < b.createdAt) return 1; else return -1; });
              }
        }),
        getEvent: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (eventId) => ({ url: `/events/${eventId}` }),
            transformResponse: responseData => {
        
                //let temp = responseData.sort(function compareFn(a, b) { if (a.createdAt < b.createdAt) return 1; else return -1; })
                responseData.calls.forEach(function (call) {
                    call.played = false;
                  });
                return responseData;
              }
        }),
        getSiteStats: builder.query({
            query: () => ({ url: '/stats' }),
            transformResponse: responseData => {
                // You can add any data transformation here if needed
                return responseData;
            }
        }),
        getTalkgroups: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: `/${shortName}/talkgroups` })
        }),
        getStats: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: `/${shortName}/stats` })
        }),
        addNewEvent: builder.mutation({
            query: initialEvent => ({
                url: '/events',
                method: 'POST',
                body: initialEvent
            })
        }),
        contactSystem: builder.mutation({
            query: (args) => {
                const {shortName, body} = args;
                return {
                url: `/${shortName}/contact`,
                method: 'POST',
                body: body
            }}
        })

    })
})

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetStatsQuery, useGetEventsQuery, useGetEventQuery, useAddNewEventMutation, useContactSystemMutation } = apiSlice
