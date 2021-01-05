import { combineReducers } from "redux"
import { connectRouter } from 'connected-react-router'
import system from "../System/system-reducer"
import statistic from "../System/statistic-reducer"
import talkgroup from "../Talkgroups/talkgroup-reducer"
import group from "../Group/group-reducer"
import error from "../System/error-reducer"
import permission from "../Permission/permission-reducer"
import user from "../User/user-reducer"


export default (history) => combineReducers({
	router: connectRouter(history),
	system,
	talkgroup,
	statistic,
	error,
	group,
	permission,
	user
})
