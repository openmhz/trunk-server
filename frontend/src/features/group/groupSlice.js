const groupSlice = createSlice({
    name: 'group',
    initialState: [],
    reducers: {
    },
  })

  // Extract the action creators object and the reducer
const { actions, reducer } = groupSlice
// Export the reducer, either as a default or named export
export default reducer