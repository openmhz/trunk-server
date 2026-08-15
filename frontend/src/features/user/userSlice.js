import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

/**
 * Who is signed in, as far as the player is concerned.
 *
 * The player issues no logins of its own - the account service owns that, and
 * the session cookie is shared across the sites. All this does is ask the
 * account service who the visitor is, so the UI can offer a sign-in prompt
 * instead of silently rendering nothing when the API answers 401.
 */
export const authenticateUser = createAsyncThunk(
    'user/authenticate',
    async () => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/authenticated";
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
        }).then((data) => data.json());
        return res;
    }
)

/**
 * Ends the session. One cookie covers the player, the account site and the
 * admin portal, so this signs you out of all three - which is why the UI asks
 * before calling it.
 */
export const logoutUser = createAsyncThunk(
    'user/logout',
    async () => {
        const url = process.env.REACT_APP_ACCOUNT_SERVER + "/logout";
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
        }).then((data) => data.json());
        return res;
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        // hasChecked distinguishes "not signed in" from "we have not asked yet",
        // so the page can avoid flashing a sign-in wall before the answer lands.
        hasChecked: false,
        authenticated: false,
        callsign: "",
        firstName: "",
        admin: false,
    },
    reducers: {},
    extraReducers: {
        [authenticateUser.fulfilled]: (state, { payload }) => {
            state.hasChecked = true;
            if (payload && payload.success) {
                state.authenticated = true;
                state.callsign = (payload.user.callsign || "").toUpperCase();
                state.firstName = payload.user.firstName || "";
                state.admin = !!payload.user.admin;
            } else {
                state.authenticated = false;
            }
        },
        [authenticateUser.rejected]: (state) => {
            // The account service being unreachable is not the same as being
            // signed out, but there is nothing the player can do either way.
            state.hasChecked = true;
            state.authenticated = false;
        },
        [logoutUser.fulfilled]: (state) => {
            state.authenticated = false;
            state.callsign = "";
            state.firstName = "";
            state.admin = false;
        },
    },
})

export const selectUser = (state) => state.user;

export default userSlice.reducer;
