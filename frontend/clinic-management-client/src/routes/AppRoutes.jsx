// src/routes/AppRoutes.jsx

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import PatientLayout from "../layouts/PatientLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/patient/HomePage";
import BookingPage from "../pages/patient/BookingPage";
import BackendTestPage from "../pages/BackendTestPage";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    Patient / Public Routes
                ========================= */}
                <Route element={<PatientLayout />}>

                    <Route
                        path="/"
                        element={<HomePage />}
                    />

                    <Route
                        path="/login"
                        element={
                            <div>
                                Login Page
                            </div>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <div>
                                Register Page
                            </div>
                        }
                    />

                    <Route
                        path="/booking"
                        element={<BookingPage />}
                    />

                    {/* Test Backend */}
                    <Route
                        path="/test-backend"
                        element={<BackendTestPage />}
                    />

                </Route>

                {/* =========================
                    Internal Routes
                ========================= */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "Admin",
                                "Doctor",
                                "Receptionist",
                            ]}
                        />
                    }
                >
                    <Route
                        path="/internal"
                        element={<AdminLayout />}
                    >
                        <Route
                            path="dashboard"
                            element={
                                <div>
                                    Internal Dashboard
                                </div>
                            }
                        />

                        <Route
                            path="appointments"
                            element={
                                <div>
                                    Appointments
                                </div>
                            }
                        />

                        <Route
                            path="patients"
                            element={
                                <div>
                                    Patients
                                </div>
                            }
                        />

                    </Route>
                </Route>

                {/* =========================
                    Unauthorized
                ========================= */}
                <Route
                    path="/unauthorized"
                    element={
                        <div>
                            You are not authorized.
                        </div>
                    }
                />

                {/* =========================
                    404
                ========================= */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
