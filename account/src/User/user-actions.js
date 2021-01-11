import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./user-constants";
import { push } from 'connected-react-router';

// "Log In" action creators
function beginLogin() {
  return { type: types.MANUAL_LOGIN_USER };
}

function loginSuccess(data) {
  return {
    type: types.LOGIN_SUCCESS_USER,
    data
  };
}

function loginEmailError(data) {
  return {
    type: types.LOGIN_EMAIL_ERROR_USER,
    data
  };
}
function loginError() {
  return { type: types.LOGIN_ERROR_USER };
}

// "update profile" action creators
function beginUpdateProfile() {
  return { type: types.UPDATE_PROFILE_USER };
}

function updateProfileSuccess(data) {
  return { type: types.UPDATE_PROFILE_SUCCESS_USER, data };
}

function updateProfileError() {
  return { type: types.UPDATE_PROFILE_ERROR_USER };
}

// "Reset Password" action creators
function beginResetPassword() {
  return { type: types.RESET_PASSWORD_USER };
}

function resetPasswordSuccess() {
  return { type: types.RESET_PASSWORD_SUCCESS_USER };
}

function resetPasswordError() {
  return { type: types.RESET_PASSWORD_ERROR_USER };
}

// "Send Reset Password" action creators
function beginSendResetPassword() {
  return { type: types.SEND_RESET_PASSWORD_USER };
}

function sendResetPasswordSuccess() {
  return { type: types.SEND_RESET_PASSWORD_SUCCESS_USER };
}

function sendResetPasswordError() {
  return { type: types.SEND_RESET_PASSWORD_ERROR_USER };
}

// "Confirm" action creators
function beginConfirm() {
  return { type: types.CONFIRM_USER };
}

function confirmSuccess() {
  return { type: types.CONFIRM_SUCCESS_USER };
}

function confirmError() {
  return { type: types.CONFIRM_ERROR_USER };
}

// "Send Confirm" action creators
function beginSendConfirm() {
  return { type: types.SEND_CONFIRM_USER };
}

function sendConfirmSuccess() {
  return { type: types.SEND_CONFIRM_SUCCESS_USER };
}

function sendConfirmError() {
  return { type: types.SEND_CONFIRM_ERROR_USER };
}

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

// "Register" action creators
function beginRegister() {
  return { type: types.REGISTER_USER };
}

function registerSuccess(data) {
  return {
    type: types.REGISTER_SUCCESS_USER,
    data
  };
}

function registerError() {
  return { type: types.REGISTER_ERROR_USER };
}

// "Terms" action creators
function beginAgreeTerms() {
  return { type: types.AGREE_TERMS_USER };
}

function agreeTermsSuccess() {
  return { type: types.AGREE_TERMS_SUCCESS_USER };
}

function agreeTermsError() {
  return { type: types.AGREE_TERMS_ERROR_USER };
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
export function manualLogin(
  data,
  success // path to redirect to upon successful log in
) {
  return dispatch => {
    dispatch(beginLogin());

    return makeUserRequest("post", data, "/login", { withCredentials: true })
      .then(response => {
        if (response.data.success) {
          const user = response.data.user
          dispatch(loginSuccess(user));
          // use browserHistory singleton to control navigation. Will generate a
          // state change for time-traveling as we are using the react-router-redux package
          //browserHistory.push(successPath)
          if (success && (success.type === "path")) {
            dispatch(push(success.nextPathname));
          } else if (success && (success.type === "location")) {
            window.location = success.nextLocation;
          } else {
            dispatch(push("/"));
          }
        } else {
          let loginMessage = response.data.message;
          console.log("loginMessage");
          if (loginMessage === "unconfirmed email") {
            data.userId = response.data.userId;
            dispatch(loginEmailError(data));
            dispatch(push("/wait-confirm-email"));
          } else {
            dispatch(loginError());
          }
          return loginMessage;
        }
      })
      .catch(function (response) {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html
export function isAuthenticated() {
  return dispatch => {

    return axios
      .get("/authenticated")
      .then(response => {
        if (response.data.success) {
          dispatch(loginSuccess());
          return true;
        } else {
          dispatch(loginError());
          return false;
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




// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html
export function manualLogout() {
  return dispatch => {
    dispatch(beginLogout());

    return axios
      .get("/logout")
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

export function confirmEmail(userId, token) {
  return dispatch => {
    dispatch(beginConfirm());
    return makeUserRequest("post", {}, "/users/" + userId + "/confirm/" + token).then(
      response => {
        if (response.data.success) {
          dispatch(confirmSuccess());
          let requestMessage = { success: true, message: response.data.message };
          return requestMessage;
        } else {
          dispatch(confirmError());
          let requestMessage = { success: false, message: response.data.message };
          return requestMessage;
        }
      }
    );
  };
}

export function resetPassword(userId, token, password) {
  return dispatch => {
    dispatch(beginResetPassword());
    return makeUserRequest("post", { password: password }, "/users/" + userId + "/reset-password/" + token).then(
      response => {
        if (response.data.success) {
          dispatch(resetPasswordSuccess());
          dispatch(push("/login"));
        } else {
          dispatch(resetPasswordError());
          let requestMessage = response.data.message;
          return requestMessage;
        }
      }
    );
  };
}

export function sendResetPassword(data) {
  return dispatch => {
    dispatch(beginSendResetPassword());
    return makeUserRequest("post", data, "/api/send-reset-password").then(
      response => {
        if (response.data.success) {
          dispatch(sendResetPasswordSuccess());
        } else {
          dispatch(sendResetPasswordError());
          return response.data.message;
        }

      }
    );
  };
}


export function sendConfirmEmail(data) {
  return dispatch => {
    dispatch(beginSendConfirm());
    return makeUserRequest("post", data, "/users/" + data + "/send-confirm").then(
      response => {
        if (response.data.success) {
          dispatch(sendConfirmSuccess());
          dispatch(push("/sent-confirm-email"));
        } else {
          dispatch(sendConfirmError());
          let requestMessage = response.data.Message;
          return requestMessage;
        }
      }
    );
  };
}

export function acceptTerms(data) {
  return dispatch => {
    dispatch(beginAgreeTerms());
    return makeUserRequest("post", data, "/users/" + data + "/terms").then(
      response => {
        if (response.data.success) {
          dispatch(agreeTermsSuccess());
        } else {
          dispatch(agreeTermsError());
          let requestMessage = response.data.Message;
          return requestMessage;
        }
      }
    );
  };
}

export function updateProfile(data) {
  return dispatch => {
    dispatch(beginUpdateProfile());

    return makeUserRequest("post", data, "/users/" + data.userId)
      .then(response => {
        if (response.data.success) {
          const user = response.data.user
          dispatch(updateProfileSuccess(user));
          dispatch(push("/"));
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

export function manualRegister(data) {
  return dispatch => {
    dispatch(beginRegister());

    return makeUserRequest("post", data, "/register")
      .then(response => {
        if (response.data.success) {
          data.userId = response.data.userId;
          dispatch(registerSuccess(data));
          dispatch(push("/sent-confirm-email"));
        } else {
          dispatch(registerError());
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
