
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import systemReducer from "../System/system-reducer"
import talkgroupReducer from "../Talkgroups/talkgroup-reducer"
import groupReducer from "../Group/group-reducer"
import errorReducer from "../System/error-reducer"
import statisticReducer from "../System/statistic-reducer"
import permissionReducer from "../Permission/permission-reducer"
import userReducer from "../User/user-reducer"

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  system: systemReducer,
  statistic: statisticReducer,
  talkgroup: talkgroupReducer,
	group: groupReducer,
  user: userReducer,
  error: errorReducer,
  permission: permissionReducer
})
export default createRootReducer


