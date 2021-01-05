import {
  CREATE_GROUP,
  CREATE_SUCCESS_GROUP,
  CREATE_ERROR_GROUP,
  DELETE_GROUP,
  DELETE_SUCCESS_GROUP,
  DELETE_ERROR_GROUP,
  UPDATE_GROUP,
  UPDATE_SUCCESS_GROUP,
  UPDATE_ERROR_GROUP,
  FETCH_GROUP,
  FETCH_SUCCESS_GROUP,
  FETCH_ERROR_GROUP,
  REORDER_GROUP,
  SAVE_ORDER_GROUP,
  SAVE_ORDER_ERROR_GROUP,
  SAVE_ORDER_SUCCESS_GROUP
} from "./group-constants";


function updateItemInArray(array, updatedItem) {
    const updatedItems = array.map(item => {
        if(item._id !== updatedItem._id) {
            // Since we only want to update one item, preserve all others as they are now
            return item;
        }
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

    case SAVE_ORDER_GROUP:
    case CREATE_GROUP:
    case FETCH_GROUP:
    case DELETE_GROUP:
    case UPDATE_GROUP:
      return Object.assign({}, state, { isWaiting: true});

    case UPDATE_SUCCESS_GROUP:
    const updatedGroups = updateItemInArray(state.items[action.data.shortName], action.data);
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: updatedGroups
        }
      });


    case CREATE_SUCCESS_GROUP:
    const newGroups = state.items[action.data.shortName].concat(action.data);
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: newGroups
        }
      });

      case DELETE_SUCCESS_GROUP:
      const delGroups = state.items[action.data.shortName].filter(x => x._id !== action.data.groupId);
      return Object.assign({}, state, {
          isWaiting: false,
          items: {
            ...state.items,
            [action.data.shortName]: delGroups
          }
        });

    case FETCH_SUCCESS_GROUP:
    return Object.assign({}, state, {
        isWaiting: false,
        items: {
          ...state.items,
          [action.data.shortName]: action.data.groups
        }
      });

    case SAVE_ORDER_SUCCESS_GROUP:
    return Object.assign({}, state, {
      orderChange: false,
      isWaiting: false
    });

    case SAVE_ORDER_ERROR_GROUP:
    case FETCH_ERROR_GROUP:
    case CREATE_ERROR_GROUP:
    case DELETE_ERROR_GROUP:
    case UPDATE_ERROR_GROUP:
      return Object.assign({}, state, {
        isWaiting: false
      });

    case REORDER_GROUP:
    if ((action.data.newIndex<0)||(action.data.newIndex>(state.items[action.data.shortName].length-1))) {
      return state
    }
    const moveGroups = state.items[action.data.shortName].slice();
    moveGroups.splice(action.data.newIndex, 0, moveGroups.splice(action.data.oldIndex, 1)[0]);
    return Object.assign({}, state, {
      orderChange: true,
      items: {
        ...state.items,
        [action.data.shortName]: moveGroups
      }
    });

    default:
      return state;
  }
};

export default group;
