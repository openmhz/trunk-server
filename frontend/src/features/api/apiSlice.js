// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createSelector} from '@reduxjs/toolkit'


// Define our single API slice object
export const apiSlice = createApi({
    // The cache reducer expects to be added at `state.api` (already default - this is optional)
    reducerPath: 'api',

    // All of our requests will have URLs starting with '/fakeApi'
    // credentials: the backend requires a signed-in listener for call content,
    // and the session cookie only travels on credentialed requests. Without
    // this every gated endpoint answers 401 even when signed in.
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.REACT_APP_BACKEND_SERVER,
        credentials: 'include',
    }),
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
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetStatsQuery, useGetSiteStatsQuery, useContactSystemMutation } = apiSlice
