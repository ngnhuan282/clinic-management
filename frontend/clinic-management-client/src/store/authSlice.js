// src/store/authSlice.js

import { createSlice } from "@reduxjs/toolkit";

const savedToken = localStorage.getItem("accessToken");
const savedUser = localStorage.getItem("user");

const initialState = {
    accessToken: savedToken || null,
    user: savedUser ? JSON.parse(savedUser) : null,
    isAuthenticated: !!savedToken,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { accessToken, user } = action.payload;

            state.accessToken = accessToken;
            state.user = user;
            state.isAuthenticated = true;

            localStorage.setItem(
                "accessToken",
                accessToken
            );

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );
        },

        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isAuthenticated = false;

            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        },
    },
});

export const {
    setCredentials,
    logout,
} = authSlice.actions;

export default authSlice.reducer;