import {
  FETCH_GROUP,
  FETCH_SUCCESS_GROUP,
  FETCH_ERROR_GROUP
} from "./group-constants";


const group = (
  state = {
    orderChange: false,
    isWaiting: false,
    items: {}},
  action
) => {
  switch (action.type) {


    case FETCH_GROUP:
      return Object.assign({}, state, { isWaiting: true});


    case FETCH_SUCCESS_GROUP:
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: action.data.groups
        }
      });

    case FETCH_ERROR_GROUP:
      return Object.assign({}, state, {
        isWaiting: false
      });


    default:
      return state;
  }
};

export default group;
