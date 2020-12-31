import axios from 'axios';
//import { browserHistory } from "react-router"
import * as types from "./talkgroup-constants";
import { push } from 'connected-react-router';

// "Log In" action creators
function beginImportTalkgroup() {
  return { type: types.IMPORT_TALKGROUP };
}

function importTalkgroupSuccess(data) {
  return {
    type: types.IMPORT_SUCCESS_TALKGROUP,
    data
  };
}

function importTalkgroupError(data) {
  return {
    type: types.IMPORT_ERROR_TALKGROUP,
    data
  };
}

function beginExportTalkgroup() {
  return { type: types.EXPORT_TALKGROUP };
}

function exportTalkgroupSuccess() {
  return { type: types.EXPORT_SUCCESS_TALKGROUP };
}

function exportTalkgroupError() {
  return { type: types.EXPORT_ERROR_TALKGROUP };
}


function beginFetchTalkgroup() {
  return { type: types.FETCH_TALKGROUP };
}

function fetchTalkgroupSuccess(data) {
  return { type: types.FETCH_SUCCESS_TALKGROUP,
  data };
}

function fetchTalkgroupError(data) {
  return { type: types.FETCH_ERROR_TALKGROUP,
  data };
}


function makeUserRequest(method, data, api) {
  // returns a Promise
  return axios({
    method: method,
    url: api,
    data: data
  });
}

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}


// https://stackoverflow.com/questions/41878838/how-do-i-set-multipart-in-axios-with-react



function shouldFetchTalkgroups(state, shortName) {
  if (!state.talkgroup.items.hasOwnProperty(shortName)) {
    return true
  } else if (state.talkgroup.isWaiting) {
    return false
  } else {
    return false
  }
}

export function fetchTalkgroups(shortName) {
  return (dispatch, getState) => {
    if (shouldFetchTalkgroups(getState(), shortName)) {
    dispatch(beginFetchTalkgroup());

    return axios
      .get(backend_server + "/" + shortName + "/talkgroups")
      .then(response => {
        if (response.data) {
          var data = {shortName: shortName, talkgroups: response.data.talkgroups}
          dispatch(fetchTalkgroupSuccess( data));
        } else {
          dispatch(fetchTalkgroupError());
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
