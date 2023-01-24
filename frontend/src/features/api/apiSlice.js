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
            query: () => ({ url: '/events' })
        }),
        getEvent: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (eventId) => ({ url: `/events/${eventId}` })
        }),
        getTalkgroups: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: `/${shortName}/talkgroups` })
        }),
        addNewEvent: builder.mutation({
            query: initialEvent => ({
                url: '/events',
                method: 'POST',
                body: initialEvent
            })
        })

    })
})

export const selectSystemsResult = apiSlice.endpoints.getSystems.select();

const emptySystems = []

export const selectAllSystems = createSelector(
    selectSystemsResult,
    systemsResult => systemsResult?.data ?? emptySystems
) 

export const selectActiveSystems = createSelector(
    selectAllSystems,
    (state, userId) => userId,
    (systems, userId) => systems.find(system => system.active === true)
)

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetEventsQuery, useGetEventQuery, useAddNewEventMutation } = apiSlice
