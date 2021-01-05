import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./system-constants";
import { push } from  'connected-react-router';


// "Log In" action creators
function beginCreateSystem() {
  return { type: types.CREATE_SYSTEM };
}

function createSystemSuccess(data) {
  return {
    type: types.CREATE_SUCCESS_SYSTEM,
    data
  };
}

function createSystemError(data) {
  return {
    type: types.CREATE_ERROR_SYSTEM,
    data
  };
}

function beginUpdateSystem() {
  return { type: types.UPDATE_SYSTEM };
}

function updateSystemSuccess(data) {
  return { type: types.UPDATE_SUCCESS_SYSTEM, data };
}

function updateSystemError(data) {
  return { type: types.UPDATE_ERROR_SYSTEM, data };
}

function beginDeleteSystem() {
  return { type: types.DELETE_SYSTEM };
}

function deleteSystemSuccess(data) {
  return { type: types.DELETE_SUCCESS_SYSTEM, 
  data };
}

function deleteSystemError() {
  return { type: types.DELETE_ERROR_SYSTEM };
}

function beginFetchSystem() {
  return { type: types.FETCH_SYSTEM };
}

function fetchSystemSuccess(data) {
  return { type: types.FETCH_SUCCESS_SYSTEM,
  data };
}

function fetchStatisticSuccess(data) {
  return { type: types.FETCH_SUCCESS_STATISTIC,
  data };
}

function fetchSystemError(data) {
  return { type: types.FETCH_ERROR_SYSTEM,
  data };
}

function beginFetchError() {
  return { type: types.FETCH_ERROR };
}

function fetchErrorsSuccess(data) {
  return { type: types.FETCH_SUCCESS_ERROR,
  data };
}

function fetchErrorsError(data) {
  return { type: types.FETCH_ERROR_ERROR,
  data };
}

function makeUserRequest(method, data, api = "/login") {
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

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

export function updateSystem(data) {
  return dispatch => {
    dispatch(beginUpdateSystem());

    return makeUserRequest("post", data, process.env.REACT_APP_BACKEND_SERVER + "/systems/" + data.shortName)
      .then(response => {
        if (response.data.success) {
          dispatch(updateSystemSuccess(response.data.system));
        } else {
          dispatch(updateSystemError());
          return response.data.message;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
}

function shouldFetchSystems(state, subreddit) {
  if ((!state.system.items) || (state.system.items.length <1)) {
    return true
  } else if (state.system.isWaiting) {
    return false
  } else {
    return false
  }
}

export function fetchErrors(shortName) {
  return (dispatch, getState) => {

    dispatch(beginFetchError());

    return axios
      .get(process.env.REACT_APP_BACKEND_SERVER + "/" + shortName + "/systems")
      .then(response => {
        if (response.data) {
          dispatch(fetchErrorsSuccess(shortName, response.data));
        } else {
          dispatch(fetchErrorsError());
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
}

export function fetchSystems() {
  return (dispatch, getState) => {
    if (shouldFetchSystems(getState())) {
    dispatch(beginFetchSystem());

    return axios
      .get(process.env.REACT_APP_ADMIN_SERVER + "/systems")
      .then(response => {
        if (response.data.success) {
          dispatch(fetchSystemSuccess(response.data.systems));
          dispatch(fetchStatisticSuccess(response.data.stats));
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

export function deleteSystem(shortName) {
  return dispatch => {
    dispatch(beginDeleteSystem());

    return makeUserRequest("delete", null, process.env.REACT_APP_BACKEND_SERVER + "/systems/"+shortName)
      .then(response => {
        if (response.data.success) {
          dispatch(deleteSystemSuccess({shortName: shortName}));
          dispatch(push("/list-systems"));
        } else {
          dispatch(deleteSystemError());
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
}

export function createSystem(data) {
  return dispatch => {
    dispatch(beginCreateSystem());

    return makeUserRequest("post", data, process.env.REACT_APP_BACKEND_SERVER + "/systems")
      .then(response => {
        if (response.data.success) {
          dispatch(createSystemSuccess(response.data.system));
        } else {
          dispatch(createSystemError());
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
}
