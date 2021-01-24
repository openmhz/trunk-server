import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./group-constants";
import { push } from  'connected-react-router';

// "Log In" action creators
function beginCreateGroup() {
  return { type: types.CREATE_GROUP };
}

function createGroupSuccess(data) {
  return {
    type: types.CREATE_SUCCESS_GROUP,
    data
  };
}

function createGroupError(data) {
  return {
    type: types.CREATE_ERROR_GROUP,
    data
  };
}


function beginUpdateGroup() {
  return { type: types.UPDATE_GROUP };
}

function updateGroupSuccess(data) {
  return { type: types.UPDATE_SUCCESS_GROUP, data };
}

function updateGroupError() {
  return { type: types.UPDATE_ERROR_GROUP };
}


function beginDeleteGroup() {
  return { type: types.DELETE_GROUP };
}

function deleteGroupSuccess(data) {
  return { type: types.DELETE_SUCCESS_GROUP, data };
}

function deleteGroupError() {
  return { type: types.DELETE_ERROR_GROUP };
}

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

function saveGroupOrderSuccess() {
  return { type: types.SAVE_ORDER_SUCCESS_GROUP };
}

function saveGroupOrderError() {
  return { type: types.SAVE_ORDER_ERROR_GROUP };
}

function makeUserRequest(method, data, api = "/login") {
  // returns a Promise
  return axios({
    method: method,
    url: api,
    data: data,
    config: {withCredentials: true}
  });
}

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

export function updateGroup(data) {
  return dispatch => {
    dispatch(beginUpdateGroup());

    return makeUserRequest("post", data, process.env.REACT_APP_ADMIN_SERVER + "/groups/" + data.shortName + "/" + data._id)
      .then(response => {
        if (response.data.success) {
          dispatch(updateGroupSuccess(response.data.group));
        } else {
          dispatch(updateGroupError());
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

function shouldFetchGroups(state,shortName) {
  if (!state.group.items || !state.group.items[shortName]) {
    return true;
  } else if (state.group.isWaiting) {
    return false;
  } else {
    return false;
  }
}

export function reorderGroup(shortName, oldIndex, newIndex) {
  return (dispatch, getState) => {
    const data = {
      shortName: shortName,
      oldIndex: oldIndex,
      newIndex: newIndex
    };
    dispatch({
      type: types.REORDER_GROUP,
      data
    });
  };
}

export function fetchGroups(shortName) {
  return (dispatch, getState) => {
    if (shouldFetchGroups(getState(), shortName)) {
      dispatch(beginFetchGroup());
      return axios
        .get(process.env.REACT_APP_ADMIN_SERVER + "/groups/" + shortName, {withCredentials: true})
        .then(response => {
          if (response.data.success) {
            const data = { shortName: shortName, groups: response.data.groups };
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

export function saveGroupOrder(shortName, data) {
  return dispatch => {
    dispatch({
      type: types.SAVE_ORDER_GROUP,
      data
    });

    return makeUserRequest(
      "post",
      data,
      process.env.REACT_APP_ADMIN_SERVER + "/groups/" + shortName + "/reorder"
    )
      .then(response => {
        if (response.data.success) {
          dispatch(saveGroupOrderSuccess());
        } else {
          dispatch(saveGroupOrderError());
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

export function deleteGroup(shortName, groupId) {
  return dispatch => {
    dispatch(beginDeleteGroup());

    return makeUserRequest("delete", null, process.env.REACT_APP_ADMIN_SERVER + "/groups/" + shortName + "/" + groupId)
      .then(response => {
        if (response.data.success) {
          const data = {shortName: shortName, groupId: groupId}
          dispatch(deleteGroupSuccess(data));
        } else {
          dispatch(deleteGroupError());
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


export function createGroup(data) {
  return dispatch => {
    dispatch(beginCreateGroup());

    return makeUserRequest("post", data, process.env.REACT_APP_ADMIN_SERVER + "/groups/" + data.shortName)
      .then(response => {
        if (response.data.success) {
          dispatch(createGroupSuccess(response.data.group));
        } else {
          dispatch(createGroupError());
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
