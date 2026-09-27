// src/routes/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { redirectForProtectedRoute } from "./roleAccess";

function ProtectedRoute({ allowedRoles = [], allowedPermissions = [], allowInternal = false }) {
    const {
        isAuthenticated,
        role,
        permissions,
    } = useAuth();

    const location = useLocation();

    const redirect = redirectForProtectedRoute(
        { isAuthenticated, role, permissions }, location.pathname,
        { allowedRoles, allowedPermissions, allowInternal }
    );

    if (redirect === "/internal/login" || redirect === "/login") {
        return (
            <Navigate
                to={redirect}
                replace
                state={{ from: location }}
            />
        );
    }

    if (redirect) {
        return (
            <Navigate
                to={redirect}
                replace
                state={{ deniedPath: location.pathname }}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
