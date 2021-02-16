import {
  FETCH_SYSTEM,
  FETCH_SUCCESS_SYSTEM,
  FETCH_ERROR_SYSTEM
} from "./system-constants";


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
