import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./system-constants";
import { push } from 'connected-react-router';


function beginUpdateSystem() {
  return { type: types.UPDATE_SYSTEM };
}

function updateSystemSuccess(data) {
  return { type: types.UPDATE_SUCCESS_SYSTEM, data };
}

function updateSystemError(data) {
  return { type: types.UPDATE_ERROR_SYSTEM, data };
}


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

function beginUpdatePlan() {
  return { type: types.UPDATE_PLAN };
}

function updatePlanSuccess(data) {
  return { type: types.UPDATE_PLAN_SUCCESS,
  data };
}


function updatePlanError(data) {
  return { type: types.UPDATE_PLAN_ERROR,
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


export function updatePlan(data) {
  return dispatch => {
    dispatch(beginUpdatePlan());

    return makeUserRequest("post", {updatePlans:data}, account_server + "/api/plans/", {withCredentials: true})
      .then(response => {
        if (response.data.success) {
          dispatch(updatePlanSuccess(response.data.systems));
        } else {
          dispatch(updatePlanError());
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



// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

export function updateSystem(data) {
  return dispatch => {
    dispatch(beginUpdateSystem());

    return makeUserRequest("post", data, admin_server + "/systems/" + data.shortName, {withCredentials: true})
      .then(response => {
        if (response.data.success) {
          const user = response.data.user

          dispatch(updateSystemSuccess(response.data.system));
          dispatch(push("/system/"+data.shortName));
        } else {
          dispatch(updateProfileError());
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
      .get(admin_server + "/systems", {withCredentials: true})
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
