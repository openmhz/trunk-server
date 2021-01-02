import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./group-constants";
import { push } from 'connected-react-router';

// "Log In" action creators


function beginFetchGroup() {
  return { type: types.FETCH_GROUP };
}

function fetchGroupSuccess(data) {
  return {
    type: types.FETCH_SUCCESS_GROUP,
    data
  };
}

function fetchGroupError(data) {
  return {
    type: types.FETCH_ERROR_GROUP,
    data
  };
}


export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html


function shouldFetchGroups(state,shortName) {
  if (!state.group.items || !state.group.items[shortName]) {
    return true;
  } else if (state.group.isWaiting) {
    return false;
  } else {
    return false;
  }
}


export function fetchGroups(shortName) {
  return (dispatch, getState) => {
    if (shouldFetchGroups(getState(), shortName)) {
      dispatch(beginFetchGroup());
      return axios
        .get(process.env.REACT_APP_BACKEND_SERVER + "/" + shortName + "/groups")
        .then(response => {
          if (true) { //response.data.success) {
            const data = { shortName: shortName, groups: response.data };
            dispatch(fetchGroupSuccess(data));
          } else {
            dispatch(fetchGroupError());
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
    }
  };
}
