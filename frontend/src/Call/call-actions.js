import axios from "axios";

import * as types from "./call-constants";
import { push } from 'connected-react-router';

function beginFetchCallInfo() {
  return { type: types.FETCH_CALL_INFO };
}

function fetchCallInfoSuccess(data) {
  return { type: types.FETCH_SUCCESS_CALL_INFO,
  data };
}

function fetchCallInfoError(data) {
  return { type: types.FETCH_ERROR_CALL_INFO,
  data };
}

function prependCall() {
  return { type: types.PREPEND_CALL };
}

function beginAddStar() {
  return { type: types.ADD_STAR };
}

function addStarSuccess(data) {
  return { type: types.ADD_STAR_SUCCESS, data };
}

function addStarError(data) {
  return { type: types.ADD_STAR_ERROR, data };
}

function beginFetchCall() {
  return { type: types.FETCH_CALL };
}

function fetchCallSuccess(data) {
  return { type: types.FETCH_SUCCESS_CALL,
  data };
}



function fetchOlderCallSuccess(data) {
  return { type: types.FETCH_SUCCESS_OLDER_CALL,
  data };
}

function fetchNewerCallSuccess(data) {
  return { type: types.FETCH_SUCCESS_NEWER_CALL,
  data };
}

function fetchCallError(data) {
  return { type: types.FETCH_ERROR_CALL,
  data };
}


export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

function shouldFetchCalls(state, subreddit) {
  return true;
  if ((!state.call.items) || (state.call.items.length <1)) {
    return true
  } else if (state.call.isWaiting) {
    return false
  } else {
    return false
  }
}




function buildUrlParams(a) {
 return Object.keys(a).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(a[k])
  }).join('&')
}

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

export function fetchNewerCalls( timestamp) {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchCalls(state)) {
    dispatch(beginFetchCall());
    const url = buildCallUrl(state, timestamp, "newer")
    return axios
      .get(url)
      .then(response => {
        if ((response.data) && (response.data.calls.length >0)) {
          var data = {shortName: state.call.shortName, calls: response.data.calls}
          dispatch(fetchNewerCallSuccess(data));
        } else {
          dispatch(fetchCallError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
};
}


export function fetchOlderCalls( timestamp) {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchCalls(state)) {
    dispatch(beginFetchCall());
    const url = buildCallUrl(state, timestamp, "older")
    return axios
      .get(url)
      .then(response => {
        if (response.data) {
          var data = {shortName: state.call.shortName, calls: response.data.calls}
          dispatch(fetchOlderCallSuccess(data));
        } else {
          dispatch(fetchCallError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
};
}


export function addStar( callId) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(beginAddStar());

    const url = process.env.REACT_APP_BACKEND_SERVER + "/" + state.call.shortName.toLowerCase() + "/star/" + callId
    return axios
      .post(url,{}, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(response => {
        if (response.data.success) {
          dispatch(addStarSuccess(response.data.call));
        } else {
          dispatch(addStarError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
};



export function fetchCallInfo( callId) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(beginFetchCallInfo());

    const url = process.env.REACT_APP_BACKEND_SERVER + "/" + state.call.shortName.toLowerCase() + "/call/" + callId
    return axios
      .get(url)
      .then(response => {
        if (response.data.success) {
          dispatch(fetchCallInfoSuccess(response.data.call));
        } else {
          dispatch(fetchCallInfoError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
};

export function fetchCalls() {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchCalls(state)) {
    dispatch(beginFetchCall());
    const url=buildCallUrl(state);
    return axios
      .get(url)
      .then(response => {
        if (response.data) {
          // check to make sure you actually got some calls back.
          if (response.data.calls.length > 0) {
          var data = {shortName: state.call.shortName, calls: response.data.calls}
          dispatch(fetchCallSuccess(data));
          } else {
            dispatch(fetchCallError());
          }
        } else {
          dispatch(fetchCallError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
};
}

export function addCall(call) {
  return (dispatch, getState) => {
    dispatch({ type: types.UPSERT_CALL,  data: call});
  };
}

export function setStarred(starred) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_STARRED_FILTER,  data: starred});
  };
}

export function setLive(live) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_LIVE,  data: live});
  };
}

export function setCurrentCallId(callId) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_CURRENT_CALL_ID,  data: callId});
  };
}

// should be as a unix timestamp
export function setDateFilter(date) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_DATE_FILTER, date: date});
  };
}

export function setAllFilter() {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_ALL_FILTER});
  };
}

export function setTalkgroupFilter(tgs) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_TALKGROUP_FILTER, talkgroups: tgs});
  };
}

export function setGroupFilter(groupId) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_GROUP_FILTER, groupId: groupId});
  };
}

export function setShortName(shortName) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_SHORT_NAME,  data: shortName});
  };
}

export function setFilter(filter) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_FILTER,  data: filter});
  };
}
