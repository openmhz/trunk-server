// https://github.com/supasate/connected-react-router
// configureStore.js

import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, createStore } from 'redux'
import { createRouterMiddleware } from '@lagunovsky/redux-react-router'
import createRootReducer from './reducers'
import thunk from 'redux-thunk';
import { apiSlice } from '../features/api/apiSlice'

export const history = createBrowserHistory()

export default function configureStore(preloadedState) {
  const store = createStore(
    createRootReducer(history), // root reducer with router state
    preloadedState,
    compose(
      applyMiddleware(
        createRouterMiddleware(history), // for dispatching history actions
        thunk,
        apiSlice.middleware,
        // ... other middlewares ...
      ),
    ),
  )

  return store
}

