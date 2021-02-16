import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./system-constants";
import { push } from 'connected-react-router';


function beginFetchSystem() {
  return { type: types.FETCH_SYSTEM };
}

function fetchSystemSuccess(data) {
  return { type: types.FETCH_SUCCESS_SYSTEM,
  data };
}

function fetchSystemError(data) {
  return { type: types.FETCH_ERROR_SYSTEM,
  data };
}

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

function shouldFetchSystems(state, subreddit) {
  if ((!state.system.items) || (state.system.items.length <1)) {
    return true
  } else if (state.system.isWaiting) {
    return false
  } else {
    return false
  }
}



export function fetchSystems() {
  return (dispatch, getState) => {
    if (shouldFetchSystems(getState())) {
    dispatch(beginFetchSystem());

    return axios
      .get(process.env.REACT_APP_BACKEND_SERVER + "/systems")
      .then(response => {
        if (response.data.success) {
          dispatch(fetchSystemSuccess(response.data.systems));
        } else {
          dispatch(fetchSystemError());
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
