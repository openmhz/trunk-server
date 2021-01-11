import { combineReducers } from "redux"
import { connectRouter } from 'connected-react-router'
import user from "../User/user-reducer"
import system from "../System/system-reducer"
import billing from "../Billing/billing-reducer"

export default (history) => combineReducers({
 router: connectRouter(history),
	user,
	system,
	billing
})
