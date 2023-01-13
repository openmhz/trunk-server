// https://github.com/supasate/connected-react-router
// configureStore.js


import { apiSlice } from '../features/api/apiSlice'

import { configureStore } from '@reduxjs/toolkit'


export default function configureAppStore(preloadedState) {
  const store = configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState
  })

  return store
}