import { combineReducers } from "redux"
import { connectRouter } from 'connected-react-router'
import system from "../System/system-reducer"
import talkgroup from "../Talkgroups/talkgroup-reducer"
import group from "../Group/group-reducer"
import call from "../Call/call-reducer"


	export default (history) => combineReducers({
	 router: connectRouter(history),
	system,
	talkgroup,
	group,
	call
})
