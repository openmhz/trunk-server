import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from "../features/api/apiSlice"
import callPlayerSlice from "../features/callPlayer/callPlayerSlice"
import { callsReducer } from "../features/calls/callsSlice"

const setupStore = (preloadedState) => {
  const store = configureStore({
    reducer: {
      callPlayer: callPlayerSlice,
      calls: callsReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      // adding the api middleware enables caching, invalidation, polling and other features of `rtk-query`
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  })

  return store
}

export default setupStore;