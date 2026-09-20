// src/hooks/useAuth.js

import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../store/authSlice";
import axiosClient from "../api/axiosClient";
import { readSession } from "../utils/authStorage";

function useAuth() {
    const dispatch = useDispatch();

    const {
        accessToken,
        user,
        isAuthenticated,
    } = useSelector((state) => state.auth);

    const logout = async () => {
        const refreshToken = readSession()?.refreshToken;
        try {
            if (refreshToken) await axiosClient.post("/auth/logout", { refreshToken });
        } finally { dispatch(logoutAction()); }
    };

    return {
        accessToken,
        user,
        isAuthenticated,
        role: user?.role || null,
        userId: user?.userId || null,
        logout,
    };
}

export default useAuth;
