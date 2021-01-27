import {
  CREATE_SYSTEM,
  CREATE_SUCCESS_SYSTEM,
  CREATE_ERROR_SYSTEM,
  UPDATE_SYSTEM,
  UPDATE_SUCCESS_SYSTEM,
  UPDATE_ERROR_SYSTEM,
  DELETE_SYSTEM,
  DELETE_SUCCESS_SYSTEM,
  DELETE_ERROR_SYSTEM,
  FETCH_SYSTEM,
  FETCH_SUCCESS_SYSTEM,
  FETCH_ERROR_SYSTEM
} from "./system-constants";

function updateObjectInArray(array, shortName, updatedItem) {
    return array.map( item => {
        if(item.shortName !== shortName) {
            // This isn't the item we care about - keep it as-is
            return item;
        }

        // Otherwise, this is the one we want - return an updated value
        return {
            ...item,
            ...updatedItem
        };
    });
}


const system = (
  state = {
    isWaiting: false,
    items: []},
  action
) => {
  switch (action.type) {

    case DELETE_SYSTEM:
    case UPDATE_SYSTEM:
    case FETCH_SYSTEM:
    case CREATE_SYSTEM:

      return Object.assign({}, state, { isWaiting: true});

    case DELETE_SUCCESS_SYSTEM:
      return Object.assign({}, state, {
        items: state.items.filter(item => item.shortName !== action.data.shortName)
      });

    case UPDATE_SUCCESS_SYSTEM:
    return Object.assign({}, state, {
      items: updateObjectInArray(state.items, action.data.shortName, action.data)
    });
    case FETCH_SUCCESS_SYSTEM:
    return Object.assign({}, state, {
        isWaiting: false,
        items: action.data
      });
    case CREATE_SUCCESS_SYSTEM:
    const newItems = state.items.concat({
        name: action.data.name,
        shortName: action.data.shortName,
        description: action.data.description,
        systemType: action.data.systemType,
        city: action.data.city,
        state: action.data.state,
        county: action.data.county,
        country: action.data.country,
        key: action.data.key,
        userId: action.data.userId,
        id: action.data.id,
        showScreenName: action.data.showScreenName
    });
      return Object.assign({}, state, { isWaiting: false,
      items:  newItems});

    case DELETE_ERROR_SYSTEM:
    case UPDATE_ERROR_SYSTEM:
    case FETCH_ERROR_SYSTEM:
    case CREATE_ERROR_SYSTEM:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default system;
