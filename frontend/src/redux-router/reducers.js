
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import systemReducer from "../System/system-reducer"
import talkgroupReducer from "../Talkgroups/talkgroup-reducer"
import groupReducer from "../Group/group-reducer"
import callReducer from "../Call/call-reducer"
import {apiSlice} from "../features/api/apiSlice"
import callPlayerSlice from "../features/callPlayer/callPlayerSlice"


export default (history) => combineReducers({
  router: connectRouter(history),
  system: systemReducer,
  talkgroup: talkgroupReducer,
	group: groupReducer,
  callPlayer: callPlayerSlice,
	call: callReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,

})