import {
    createSlice,
    createEntityAdapter,
    createSelector,
    createAsyncThunk
} from '@reduxjs/toolkit'


export const authenticateUser = createAsyncThunk(
    'user/authenticate',
    async ({ getState }) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/authenticated"
        const res = await fetch(url, {
            method: 'GET',
            credentials: "include"
        }).then(
            (data) => data.json()
        )
        return res;
    }
)

export const logoutUser = createAsyncThunk(
    'user/logout',
    async ({ getState }) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/logout"
        const res = await fetch(url, {
            method: 'GET',
            credentials: "include"
        }).then(
            (data) => data.json()
        )
        return res;
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        isWaiting: false,
        authenticated: false,
        hasAuthenticated: false,
        userId: "",
        admin: false,
        email: "",
    },
    reducers: {
        increment: (state) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.value += 1
        },
    },
    extraReducers: {
        [authenticateUser.fulfilled]: (state, data) => {
            const {payload} = data;
            if (payload.success) {
                state.authenticated = true;
                state.hasAuthenticated = true;
                state.userId = payload.user.userId;
                state.admin = payload.user.admin;
                state.email = payload.user.email;
            } else {
                state.authenticated = false;
                state.hasAuthenticated = true;
            }
        },
        [authenticateUser.rejected]: (state, { payload }) => {
            state.authenticated = false;
            state.hasAuthenticated = true;

        },
        [logoutUser.fulfilled]: (state, { payload }) => {
            if (payload.success) {
                state.authenticated = false;
                state.userId = null;
            }
        },
    }
})

// Extract the action creators object and the reducer
export const userReducer = userSlice.reducer;