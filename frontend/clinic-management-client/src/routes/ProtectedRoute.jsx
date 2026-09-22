// src/routes/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ allowedRoles = [] }) {
    const {
        isAuthenticated,
        role,
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

    if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(role)
    ) {
        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
