// src/store/authSlice.js

import { createSlice } from "@reduxjs/toolkit";
import { readSession, saveSession, clearSession } from "../utils/authStorage";

const session = readSession();

const initialState = {
    accessToken: session?.accessToken || null,
    user: session?.user || null,
    isAuthenticated: Boolean(session),
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

        },

        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isAuthenticated = false;

            clearSession();
        },
    },
});

export const {
    setCredentials,
    logout,
} = authSlice.actions;

export default authSlice.reducer;
