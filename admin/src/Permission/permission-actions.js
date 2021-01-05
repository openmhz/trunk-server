import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./permission-constants";

function beginAddPermission() {
  return { type: types.ADD_PERMISSION };
}

function addPermissionSuccess(data) {
  return { type: types.ADD_PERMISSION_SUCCESS, data };
}

function addPermissionError() {
  return { type: types.ADD_PERMISSION_ERROR };
}

function beginDeletePermission() {
  return { type: types.DELETE_PERMISSION };
}

function deletePermissionSuccess(data) {
  return { type: types.DELETE_PERMISSION_SUCCESS, data };
}

function deletePermissionError() {
  return { type: types.DELETE_PERMISSION_ERROR };
}


function beginUpdateRole() {
  return { type: types.UPDATE_ROLE };
}

function updateRoleSuccess(data) {
  return { type: types.UPDATE_ROLE_SUCCESS, data };
}

function updateRoleError() {
  return { type: types.UPDATE_ROLE_ERROR };
}

// "Log In" action creators
function beginFetchPermission() {
  return { type: types.FETCH_PERMISSION };
}

function fetchPermissionError(data) {
  return { type: types.FETCH_ERROR_PERMISSION,
  data };
}

function fetchPermissionSuccess(data) {
  return { type: types.FETCH_SUCCESS_PERMISSION,
  data };
}

function shouldFetch(state) {
  if ((!state.permission.items) || (state.permission.items.length <1)) {
    return true
  } else if (state.permission.isWaiting) {
    return false
  } else {
    return false
  }
}

export function fetch(shortName) {
  return (dispatch, getState) => {
    if (shouldFetch(getState())) {
    dispatch(beginFetchPermission());

    return axios
      .get("/permissions/"+shortName)
      .then(response => {
        if (response.data.success) {
          dispatch(fetchPermissionSuccess(response.data.permissions));
        } else {
          dispatch(fetchPermissionError());
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

export function update(data) {
  return (dispatch, getState) => {

    dispatch(beginUpdateRole());
    var url = "/permissions/" + data.shortName + "/" + data.permissionId;
    return axios.post( url, data)
      .then(response => {
        if (response.data.success) {
          dispatch(updateRoleSuccess(response.data.permission));
        } else {
          dispatch(updateRoleError());
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

export function addPermission(data) {
  return (dispatch, getState) => {
    dispatch(beginAddPermission());
    var url = "/permissions/" + data.shortName;
    return axios.post( url, data)
      .then(response => {
        if (response.data.success) {
          dispatch(addPermissionSuccess(response.data.permission));
        } else {
          dispatch(addPermissionError());
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


export function deletePermission(data) {
  return (dispatch, getState) => {

    dispatch(beginDeletePermission());
    var url = "/permissions/" + data.shortName + "/" + data.permissionId;
    return axios.delete( url)
      .then(response => {
        if (response.data.success) {
          dispatch(deletePermissionSuccess(data.permissionId));
        } else {
          dispatch(deletePermissionError());
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
