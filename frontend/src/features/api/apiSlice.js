// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'


function buildCallUrl(state, date, direction) {
    var params = {};
    var url = "";


    if ((typeof direction === 'string') && (typeof date === 'number')) {
        url = url + '/' + direction;
        params["time"] = date;
    } else {
      if (state.call.filterDate){
        url = url + '/older'
        params["time"] = state.call.filterDate;
      }
    }
    if (state.call.filterStarred) {
      params["filter-starred"] = true;
    }
    switch(state.call.filterType) {
      case 1:
      params["filter-type"] = "group";
      params["filter-code"] = state.call.filterGroupId;
      break;
      case 2:
      params["filter-type"] = "talkgroup";
      params["filter-code"] = state.call.filterTalkgroups;
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
    url = process.env.REACT_APP_BACKEND_SERVER + "/" + state.call.shortName + "/calls" + url + '?' + buildUrlParams(params);
    console.log("Trying to fetch data from this url: " + url);
    return url;
}

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
            query: (shortName) => ({ url: '/${shortName}/groups' })
        }),
        getSystems: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: () => ({ url: '/systems' })
        }),
        getTalkgroups: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: (shortName) => ({ url: '/${shortName}/talkgroups' })
        }),
        getCalls: builder.query({
            // The URL for the request is '/fakeApi/posts'
            query: ({shortName, filterType, filterCode}) => ({
                url: "/${shortName}/calls",
                method: "GET",
                params: { filterType, filterCode },
              })
        })
    })
})

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGroupsQuery, useGetSystemsQuery, useGetTalkgroupsQuery, useGetCallsQuery } = apiSlice