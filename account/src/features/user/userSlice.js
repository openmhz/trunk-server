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

export const loginUser = createAsyncThunk(
    'user/login',
    async (data) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/login"
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(data)
        }).then(
            (data) => data.json()
        )
        return res;
    }
)

export const registerUser = createAsyncThunk(
    'user/register',
    async (data) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/register"
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(data)
        }).then(
            (data) => data.json()
        )
        return res;
    }
)



export const updateProfile = createAsyncThunk(
    'user/updateProfile',
    async (user) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/users/" + user.userId;
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(user)
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

export const sendConfirmEmail = createAsyncThunk(
    'user/sendConfirmEmail',
    async (userId) => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/users/" + userId + "/send-confirm";
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              }
        }).then(
            (data) => data.json()
        )
        return res;
    }
)

export const resetPassword = createAsyncThunk(
    'user/resetPassword',
    async (data) => {
        const {userId, token, password} = data;
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/users/" + userId + "/confirm/" + token
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({password})
        }).then(
            (data) => data.json()
        )
        return res;
    }
)

export const sendResetPassword = createAsyncThunk(
    'user/sendResetPassword',
    async (data) => {
        const {userId, token, password} = data;
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/api/send-reset-password"
        const res = await fetch(url, {
            method: 'POST',
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(data)
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
        firstName: "",
        lastName: "",
        location: "",
        screenName: ""
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
        [loginUser.fulfilled]: (state, data) => {
            const {payload} = data;
            if (payload.success) {
                state.authenticated = true;
                state.hasAuthenticated = true;
                state.userId = payload.user.userId;
                state.admin = payload.user.admin;
                state.email = payload.user.email;
                state.firstName = payload.user.firstName;
                state.lastName = payload.user.lastName;
                state.location = payload.user.location;
                state.screenName = payload.user.screenName;
            } else {
                state.authenticated = false;
                state.hasAuthenticated = true;
            }
        },
        [updateProfile.fulfilled]: (state, data) => {
            const {payload} = data;
            if (payload.success) {
                state.authenticated = true;
                state.hasAuthenticated = true;
                state.userId = payload.user.userId;
                state.admin = payload.user.admin;
                state.email = payload.user.email;
                state.firstName = payload.user.firstName;
                state.lastName = payload.user.lastName;
                state.location = payload.user.location;
                state.screenName = payload.user.screenName;
            } else {
                state.authenticated = false;
                state.hasAuthenticated = true;
            }
        },
        [loginUser.rejected]: (state, { payload }) => {
            state.authenticated = false;
            state.hasAuthenticated = true;
        },
        [authenticateUser.fulfilled]: (state, data) => {
            const {payload} = data;
            if (payload.success) {
                state.authenticated = true;
                state.hasAuthenticated = true;
                state.userId = payload.user.userId;
                state.admin = payload.user.admin;
                state.email = payload.user.email;
                state.firstName = payload.user.firstName;
                state.lastName = payload.user.lastName;
                state.location = payload.user.location;
                state.screenName = payload.user.screenName;
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
        [loginUser.fulfilled]: (state, { payload }) => {
            if (payload.success) {
                state.authenticated = false;
                state.userId = null;
            }
        },
    }
})

// Extract the action creators object and the reducer
export const userReducer = userSlice.reducer;