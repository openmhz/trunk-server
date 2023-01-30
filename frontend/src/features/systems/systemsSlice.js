
import {
    createSlice,
    createEntityAdapter,
    createSelector
  } from '@reduxjs/toolkit'
import { apiSlice} from '../api/apiSlice'

// Calling `someEndpoint.select(someArg)` generates a new selector that will return
// the query result object for a query with those parameters.
// To generate a selector for a specific query argument, call `select(theQueryArg)`.
// In this case, the users query has no params, so we don't pass anything to select()
export const selectSystemsResult = apiSlice.endpoints.getSystems.select()

const emptySystems = []

export const selectAllSystems = createSelector(
  selectSystemsResult,
  systemsResult => systemsResult.data?systemsResult.data.systems:emptySystems
)

export const selectActiveSystems = createSelector(
  selectAllSystems,
  (state) => null,
  (systems) => systems.filter(system => system.active === true)
)

export const selectSystem = createSelector(
  selectAllSystems,
  (state) => null,
  (systems, shortName) => systems.find(system => system.shortName === shortName)
)