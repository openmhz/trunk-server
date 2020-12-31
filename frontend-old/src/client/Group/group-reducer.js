import {
  FETCH_GROUP,
  FETCH_SUCCESS_GROUP,
  FETCH_ERROR_GROUP
} from "./group-constants";

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
