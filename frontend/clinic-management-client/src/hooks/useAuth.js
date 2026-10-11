// src/hooks/useAuth.js

import { useSelector } from "react-redux";
import { logoutSession } from "../api/axiosClient";

function useAuth() {

    const {
        accessToken,
        user,
        isAuthenticated,
        sessionChecked,
    } = useSelector((state) => state.auth);


    return {
        accessToken,
        user,
        isAuthenticated,
        sessionChecked,
        role: user?.role || null,
        permissions: user?.permissions || [],
        userId: user?.userId || null,
        logout: logoutSession,
    };
}

export default useAuth;
