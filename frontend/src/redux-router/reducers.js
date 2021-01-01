
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import systemReducer from "../System/system-reducer"

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  system: systemReducer,
})
export default createRootReducer


