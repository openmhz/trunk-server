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

function updateObject(oldObject, newValues) {
    // Encapsulate the idea of passing a new object as the first parameter
    // to Object.assign to ensure we correctly copy data instead of mutating
    return Object.assign({}, oldObject, newValues);
}

function updateItemInArray(array, itemId, updateItemCallback) {
    const updatedItems = array.map(item => {
        if(item.id !== itemId) {
            // Since we only want to update one item, preserve all others as they are now
            return item;
        }

        // Use the provided callback to create an updated item
        const updatedItem = updateItemCallback(item);
        return updatedItem;
    });

    return updatedItems;
}

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
