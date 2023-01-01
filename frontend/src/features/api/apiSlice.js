// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'



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
        getTalkgroups: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: `/${shortName}/talkgroups` })
        }),
        getCalls: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({
                url: `/${shortName}/calls`,
                method: "GET" //, params: { filterType, filterCode },
              })
        })
    })
})

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetCallsQuery } = apiSlice
