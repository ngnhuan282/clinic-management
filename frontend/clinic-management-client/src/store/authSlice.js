// src/store/authSlice.js

import { createSlice } from "@reduxjs/toolkit";
import { readSession, saveSession, clearSession } from "../utils/authStorage";

const session = readSession();

const initialState = {
    accessToken: session?.accessToken || null,
    user: session?.user || null,
    isAuthenticated: Boolean(session),
    sessionChecked: !session,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { accessToken, user } = action.payload;
            saveSession(action.payload);

            state.accessToken = accessToken;
            state.user = user;
            state.isAuthenticated = true;
            state.sessionChecked = true;

        },

        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.sessionChecked = true;

            clearSession();
        },
        sessionVerified: (state, action) => {
            state.user = action.payload;
            state.sessionChecked = true;
            const saved = readSession();
            if (saved) saveSession({ ...saved, user: action.payload });
        },
    },
});

export const {
    setCredentials,
    logout,
    sessionVerified,
} = authSlice.actions;

export default authSlice.reducer;
