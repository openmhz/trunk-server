import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./user-constants";
import { push } from  'connected-react-router';


// "Log Out" action creators
function beginLogout() {
  return { type: types.LOGOUT_USER };
}

function logoutSuccess() {
  return { type: types.LOGOUT_SUCCESS_USER };
}

function logoutError() {
  return { type: types.LOGOUT_ERROR_USER };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html
export function manualLogout() {
  return dispatch => {
    dispatch(beginLogout());

    return axios
      .get(process.env.REACT_APP_ACCOUNT_SERVER + "/logout",  {withCredentials: true})
      .then(response => {
        if (response.data.success) {
          dispatch(logoutSuccess());
          // use browserHistory singleton to control navigation. Will generate a
          // state change for time-traveling as we are using the react-router-redux package
          //browserHistory.push("/") // logout to home page
          dispatch(push("/"));
        } else {
          dispatch(logoutError());
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened during logout that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
}
