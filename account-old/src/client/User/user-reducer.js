import {
  MANUAL_LOGIN_USER,
  LOGIN_SUCCESS_USER,
  LOGIN_ERROR_USER,
  LOGIN_EMAIL_ERROR_USER,
  SEND_RESET_PASSWORD_USER,
  SEND_RESET_PASSWORD_ERROR_USER,
  SEND_RESET_PASSWORD_SUCCESS_USER,
  RESET_PASSWORD_USER,
  RESET_PASSWORD_ERROR_USER,
  RESET_PASSWORD_SUCCESS_USER,
  CONFIRM_USER,
  CONFIRM_ERROR_USER,
  CONFIRM_SUCCESS_USER,
  UPDATE_PROFILE_USER,
  UPDATE_PROFILE_ERROR_USER,
  UPDATE_PROFILE_SUCCESS_USER,
  SEND_CONFIRM_USER,
  SEND_CONFIRM_ERROR_USER,
  SEND_CONFIRM_SUCCESS_USER,
  LOGOUT_USER,
  LOGOUT_SUCCESS_USER,
  LOGOUT_ERROR_USER,
  REGISTER_USER,
  REGISTER_SUCCESS_USER,
  REGISTER_ERROR_USER
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
    case MANUAL_LOGIN_USER:
      return Object.assign({}, state, { isWaiting: true });
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

      case UPDATE_PROFILE_USER:
      return Object.assign({}, state, {
        isWaiting: true
      });

      case UPDATE_PROFILE_SUCCESS_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        ...action.data
      });

      case UPDATE_PROFILE_ERROR_USER:
      return Object.assign({}, state, {
        isWaiting: false
      });
      
    case CONFIRM_USER:
      return Object.assign({}, state, {
        isWaiting: true,
        authenticated: false
      });
    case CONFIRM_SUCCESS_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: false
      });
    case CONFIRM_ERROR_USER:
      return Object.assign({}, state, {
        isWaiting: false,
        authenticated: false
      });




      case RESET_PASSWORD_USER:
      case SEND_RESET_PASSWORD_USER:
      case SEND_CONFIRM_USER:
        return Object.assign({}, state, {
          isWaiting: true,
          authenticated: false
        });

      case RESET_PASSWORD_ERROR_USER:
      case RESET_PASSWORD_SUCCESS_USER:
      case SEND_RESET_PASSWORD_ERROR_USER:
      case SEND_RESET_PASSWORD_SUCCESS_USER:
      case SEND_CONFIRM_ERROR_USER:
      case SEND_CONFIRM_SUCCESS_USER:
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
    case REGISTER_USER:
      return Object.assign({}, state, { isWaiting: true });
    case REGISTER_SUCCESS_USER:
      return Object.assign({}, state, { isWaiting: false,
			userId: action.data.userId });
    case REGISTER_ERROR_USER:
      return Object.assign({}, state, { isWaiting: false });
    default:
      return state;
  }
};

export default user;
