const groupSlice = createSlice({
    name: 'group',
    initialState:  {
        orderChange: false,
        isWaiting: false,
        items: {}
    },
    reducers: {
    },
  })

  // Extract the action creators object and the reducer
const { actions, reducer } = groupSlice
// Export the reducer, either as a default or named export
export default reducer