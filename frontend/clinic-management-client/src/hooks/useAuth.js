// src/hooks/useAuth.js

import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../store/authSlice";

function useAuth() {
    const dispatch = useDispatch();

    const {
        accessToken,
        user,
        isAuthenticated,
    } = useSelector((state) => state.auth);

    const logout = () => {
        dispatch(logoutAction());
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