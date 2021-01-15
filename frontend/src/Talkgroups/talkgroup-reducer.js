import {
  IMPORT_TALKGROUP,
  IMPORT_SUCCESS_TALKGROUP,
  IMPORT_ERROR_TALKGROUP,
  EXPORT_TALKGROUP,
  EXPORT_SUCCESS_TALKGROUP,
  EXPORT_ERROR_TALKGROUP,
  FETCH_TALKGROUP,
  FETCH_SUCCESS_TALKGROUP,
  FETCH_ERROR_TALKGROUP
} from "./talkgroup-constants";

const talkgroup = (
  state = {
    isWaiting: false,
    items: {}},
  action
) => {
  switch (action.type) {

    case FETCH_TALKGROUP:
    case IMPORT_TALKGROUP:
    case EXPORT_TALKGROUP:
      return Object.assign({}, state, { isWaiting: true});

    case IMPORT_SUCCESS_TALKGROUP:
    case FETCH_SUCCESS_TALKGROUP:
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: action.data.talkgroups
        }
      });



    case FETCH_ERROR_TALKGROUP:
    case IMPORT_ERROR_TALKGROUP:
    case EXPORT_ERROR_TALKGROUP:
    case EXPORT_SUCCESS_TALKGROUP:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default talkgroup;
