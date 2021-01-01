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

    case FETCH_SYSTEM:

      return Object.assign({}, state, { isWaiting: true});


    case FETCH_SUCCESS_SYSTEM:
      const activeSystems = action.data.filter(system =>{
        if (system.active) {return true}
        return false;
       });
    return Object.assign({}, state, {
        isWaiting: false,
        items: activeSystems
      });

    case FETCH_ERROR_SYSTEM:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default system;
