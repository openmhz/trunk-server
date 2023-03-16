
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { createRouterReducer } from '@lagunovsky/redux-react-router'
import systemReducer from "../System/system-reducer"
import talkgroupReducer from "../Talkgroups/talkgroup-reducer"
import groupReducer from "../Group/group-reducer"
import errorReducer from "../System/error-reducer"
import statisticReducer from "../System/statistic-reducer"
import permissionReducer from "../Permission/permission-reducer"
import { userSlice, userReducer } from '../features/user/userSlice'
import {apiSlice} from "../features/api/apiSlice"

const createRootReducer = (history) => combineReducers({
  router: createRouterReducer (history),
  system: systemReducer,
  statistic: statisticReducer,
  talkgroup: talkgroupReducer,
	group: groupReducer,
  user: userReducer,
  error: errorReducer,
  permission: permissionReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,

})
export default createRootReducer


