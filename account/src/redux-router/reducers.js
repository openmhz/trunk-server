
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import user from "../User/user-reducer"

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  user,
})
export default createRootReducer


