import {
  UPDATE_SYSTEM,
  UPDATE_SUCCESS_SYSTEM,
  UPDATE_ERROR_SYSTEM,
  FETCH_SYSTEM,
  FETCH_SUCCESS_SYSTEM,
  FETCH_ERROR_SYSTEM,
  UPDATE_PLAN,
  UPDATE_PLAN_SUCCESS,
  UPDATE_PLAN_ERROR
} from "./system-constants";

function updateObject(oldObject, newValues) {
    // Encapsulate the idea of passing a new object as the first parameter
    // to Object.assign to ensure we correctly copy data instead of mutating
    return Object.assign({}, oldObject, newValues);
}

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

    case UPDATE_SYSTEM:
    case FETCH_SYSTEM:
    case UPDATE_PLAN:

      return Object.assign({}, state, { isWaiting: true});


      case UPDATE_PLAN_SUCCESS:
      return Object.assign({}, state, {
          isWaiting: false,
          items: action.data
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

    case UPDATE_PLAN_ERROR:
    case UPDATE_ERROR_SYSTEM:
    case FETCH_ERROR_SYSTEM:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default system;
