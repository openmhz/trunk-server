import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from '../features/user/userSlice'
import { apiSlice } from "../features/api/apiSlice"

const setupStore = (preloadedState) => {
  const store = configureStore({
    reducer: {
      user: userReducer,
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