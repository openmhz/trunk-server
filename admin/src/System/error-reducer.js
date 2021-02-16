import {
  FETCH,
  FETCH_SUCCESS,
  FETCH_ERROR
} from "./error-constants";



const error = (
  state = {
    isWaiting: false,
    items: {}
  },
  action
) => {
  switch (action.type) {

    case FETCH:

      return Object.assign({}, state, { isWaiting: true});


    case FETCH_SUCCESS:
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: action.data.errors
        }
      });

    case FETCH_ERROR:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default error;
