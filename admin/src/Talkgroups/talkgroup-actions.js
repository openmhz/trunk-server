import axios, { post } from 'axios';
//import { browserHistory } from "react-router"
import * as types from "./talkgroup-constants";
import { push } from  'connected-react-router';

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

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}


// https://stackoverflow.com/questions/41878838/how-do-i-set-multipart-in-axios-with-react
function fileUpload(shortName, file){
    const url = process.env.REACT_APP_ADMIN_SERVER + "/talkgroups/" + shortName + "/import";
    const formData = new FormData();
    formData.append('file',file)
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        },
        withCredentials: true 
    }
    return  post(url, formData,config)
  }

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html
export function importTalkgroups(
  shortName, file,
  successPath // path to redirect to upon successful log in
) {
  return dispatch => {
    dispatch(beginImportTalkgroup());

    return fileUpload(shortName, file)
      .then(response => {
        if (response.data.success) {
          var data = {};
          data.shortName = shortName;
          data.talkgroups = response.data.talkgroups
          dispatch(importTalkgroupSuccess(data));
          // use browserHistory singleton to control navigation. Will generate a
          // state change for time-traveling as we are using the react-router-redux package
          //browserHistory.push(successPath)

        } else {
            dispatch(importTalkgroupError(response.data.message));
          return response.data.message;
        }
      })
      .catch(function(response) {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
          return response.message;
        }
      });
  };
}

export function exportTalkgroups(
  shortName
) {
  return dispatch => {
    dispatch(beginExportTalkgroup());

    return axios
      .get(process.env.REACT_APP_ADMIN_SERVER + "/talkgroups/" + shortName + "/export", { withCredentials: true })
      .then(response => {
        if (response.data.success) {
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
      .get(process.env.REACT_APP_ADMIN_SERVER + "/talkgroups/"+shortName, { withCredentials: true })
      .then(response => {
        if (response.data.success) {
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
