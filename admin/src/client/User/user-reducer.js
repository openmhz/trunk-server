import {
  LOGOUT_USER,
  LOGOUT_SUCCESS_USER,
  LOGOUT_ERROR_USER,
  LOGIN_SUCCESS_USER,
  LOGIN_ERROR_USER,
  LOGIN_EMAIL_ERROR_USER
} from "./user-constants";

const user = (
  state = {
    isWaiting: false,
    authenticated: false,
    userId: ""
  },
  action
) => {
  switch (action.type) {
    case LOGIN_SUCCESS_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: true,
        ...action.data
      });
    case LOGIN_EMAIL_ERROR_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: false,
        userId: action.data.userId
      });
    case LOGIN_ERROR_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: false
      });
    case LOGOUT_USER:
      return Object.assign({}, state, { isWaiting: true });
    case LOGOUT_SUCCESS_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: false,
        email: "",
        userId: ""
      });
    case LOGOUT_ERROR_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: true
      });
    default:
      return state;
  }
};

export default user;
