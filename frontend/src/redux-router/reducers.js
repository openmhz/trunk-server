
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import {apiSlice} from "../features/api/apiSlice"
import callPlayerSlice from "../features/callPlayer/callPlayerSlice"
import { callsReducer } from "../features/calls/callsSlice"

export default (history) => combineReducers({
  router: connectRouter(history),
  callPlayer: callPlayerSlice,
  calls: callsReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
})