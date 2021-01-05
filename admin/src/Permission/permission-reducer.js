import {
  ADD_PERMISSION,
  ADD_PERMISSION_SUCCESS,
  ADD_PERMISSION_ERROR,
  DELETE_PERMISSION,
  DELETE_PERMISSION_SUCCESS,
  DELETE_PERMISSION_ERROR,
  FETCH_PERMISSION,
  FETCH_SUCCESS_PERMISSION,
  FETCH_ERROR_PERMISSION,
  UPDATE_ROLE,
  UPDATE_ROLE_ERROR,
  UPDATE_ROLE_SUCCESS
} from "./permission-constants";

function updateRoleInArray(array, updatedItem) {
    const updatedItems = array.map(item => {
        if(item._id !== updatedItem._id) {
            // Since we only want to update one item, preserve all others as they are now
            return item;
        }
        item.role = updatedItem.role;
        return item;
    });

    return updatedItems;
}

function deleteItemInArray(array, _id) {
    const updatedItems = array.filter(function (item) {
      return item._id !== _id;
    });

    return updatedItems;
}

const permission = (
  state = {
    isWaiting: false,
    items: []
  },
  action
) => {
  switch (action.type) {


    case ADD_PERMISSION_SUCCESS:
    return Object.assign({}, state, {
        isWaiting: false,
        items: [...state.items, action.data]
      });
    case DELETE_PERMISSION_SUCCESS:
    return Object.assign({}, state, {
        isWaiting: false,
        items: deleteItemInArray(state.items, action.data)
      });
    case UPDATE_ROLE_SUCCESS:
    return Object.assign({}, state, {
        isWaiting: false,
        items: updateRoleInArray(state.items, action.data)
      });
    case FETCH_SUCCESS_PERMISSION:
    return Object.assign({}, state, {
        isWaiting: false,
        items: action.data
      });

      case DELETE_PERMISSION_ERROR:
      case ADD_PERMISSION_ERROR:
      case UPDATE_ROLE_ERROR:
      case FETCH_ERROR_PERMISSION:
        return Object.assign({}, state, {
          isWaiting: false
        });

      case DELETE_PERMISSION:
      case ADD_PERMISSION:
      case UPDATE_ROLE:
      case FETCH_PERMISSION:
        return Object.assign({}, state, { isWaiting: true});

    default:
      return state;
  }
};

export default permission;
