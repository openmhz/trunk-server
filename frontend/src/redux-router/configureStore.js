// https://github.com/supasate/connected-react-router
// configureStore.js

import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, createStore } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createRootReducer from './reducers'
import { apiSlice } from '../features/api/apiSlice'
import {callPlayerSlice} from "../features/callPlayer/callPlayerSlice"

import thunk from 'redux-thunk';

export const history = createBrowserHistory()

export default function configureStore(preloadedState) {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
    createRootReducer(history), // root reducer with router state
    preloadedState,  
    composeEnhancers(
      applyMiddleware(
        routerMiddleware(history), // for dispatching history actions
        thunk,
        apiSlice.middleware,
        // ... other middlewares ...
      ),
    ),
  )

  return store
}