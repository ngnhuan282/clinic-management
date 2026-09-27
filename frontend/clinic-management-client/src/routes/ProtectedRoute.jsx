// src/routes/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { INTERNAL_ROLES } from "./roleAccess";

function ProtectedRoute({ allowedRoles = [], allowedPermissions = [], allowInternal = false }) {
    const {
        isAuthenticated,
        role,
        permissions,
    } = useAuth();

    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <Navigate
                to={location.pathname.startsWith("/internal") ? "/internal/login" : "/login"}
                replace
                state={{ from: location }}
            />
        );
    }

    if ((allowedRoles.length > 0 && !allowedRoles.includes(role)) ||
        (allowedPermissions.length > 0 && !allowedPermissions.some(code => permissions.includes(code))) ||
        (allowInternal && !(INTERNAL_ROLES.includes(role) || (role !== "Patient" && permissions.length > 0)))) {
        return (
            <Navigate
                to="/unauthorized"
                replace
                state={{ deniedPath: location.pathname }}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
