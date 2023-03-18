// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createSelector } from '@reduxjs/toolkit'


// Define our single API slice object
export const apiSlice = createApi({
  // The cache reducer expects to be added at `state.api` (already default - this is optional)
  reducerPath: 'api',
  // All of our requests will have URLs starting with '/fakeApi'
  baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_ADMIN_SERVER }),
  // The "endpoints" represent operations and requests for this server
  endpoints: builder => ({
    // The `getPosts` endpoint is a "query" operation that returns data
    getTalkgroups: builder.query({
      // The URL for the request is '/fakeApi/posts'
      query: (shortName) => ({ url: `/talkgroups/${shortName}`, credentials: "include" })
    }),
    getGroups: builder.query({
      // The URL for the request is '/fakeApi/posts'
      query: (shortName) => ({ url: `/groups/${shortName}`, credentials: "include" }),
      providesTags: (result, error, arg) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Group', _id })), 'Group']
          : ['Group'],
    }),

    getErrors: builder.query({
      // The URL for the request is '/fakeApi/posts'
      query: (shortName) => ({ url: `${process.env.REACT_APP_BACKEND_SERVER}/${shortName}/errors` })
    }),
    updateGroup: builder.mutation({
      query: (group) => ({
        url: `/groups/${group.shortName}/${group._id}`,
        method: 'POST',
        credentials: "include",
        body: group,
      }),
      async onQueryStarted(group, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedGroup } = await queryFulfilled
          const patchResult = dispatch(
            apiSlice.util.updateQueryData('getGroups', updatedGroup.shortName, (groups) => {
              const groupIndex = groups.findIndex((obj => obj.groupId == updatedGroup.groupId));
              groups[groupIndex] = updatedGroup;
            })
          )
        } catch { }
      },
    }),
    createGroup: builder.mutation({
      query: (group) => ({
        url: `/groups/${group.shortName}`,
        method: 'POST',
        credentials: "include",
        body: group,
      }),
      async onQueryStarted(group, { dispatch, queryFulfilled }) {
        try {
          const { data: newGroup } = await queryFulfilled;
          const patchResult = dispatch(
            apiSlice.util.updateQueryData('getGroups', newGroup.shortName, (groups) => {
              groups.push(newGroup);
            })
          )
        } catch { }
      },
    }),
    deleteGroup: builder.mutation({
      query: (group) => ({
        url: `/groups/${group.shortName}/${group._id}`,
        method: 'DELETE',
        credentials: "include"
      }),

      invalidatesTags: (result, error, group) => [{ type: 'Group', id: group._id }],
    }),
    saveGroupOrder: builder.mutation({
      query: ({shortName, order}) => ({
        url: `/groups/${shortName}/reorder`,
        method: 'POST',
        credentials: "include",
        body: order,
      }),

      //invalidatesTags: (result, error, group) => ['Group'],
    }),
    getSystems: builder.query({
      // The URL for the request is '/fakeApi/posts'
      query: () => ({ url: `/systems`, credentials: "include" })
    })

  })
})

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetErrorsQuery, useDeleteGroupMutation, useCreateGroupMutation, useSaveGroupOrderMutation, useUpdateGroupMutation } = apiSlice
