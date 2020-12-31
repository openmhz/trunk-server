
// from https://github.com/supasate/connected-react-router
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import counterReducer from '../features/counter/counterSlice';

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  counter: counterReducer,
})
export default createRootReducer


