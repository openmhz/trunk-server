
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { createRouterReducer } from '@lagunovsky/redux-react-router'
import { userSlice, userReducer } from '../features/user/userSlice'
import {apiSlice} from "../features/api/apiSlice"

const createRootReducer = (history) => combineReducers({
  router: createRouterReducer (history),
  user: userReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,

})
export default createRootReducer


