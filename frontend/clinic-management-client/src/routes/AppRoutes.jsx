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
import BackendTestPage from "../pages/BackendTestPage";
import InventoryPage from "../pages/internal/admin/InventoryPage";
import MedicineCategoriesPage from "../pages/internal/admin/MedicineCategoriesPage";
import MedicinesPage from "../pages/internal/admin/MedicinesPage";
import SuppliersPage from "../pages/internal/admin/SuppliersPage";

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

                        <Route
                            path="medicines"
                            element={<MedicinesPage />}
                        />

                        <Route
                            path="medicines/categories"
                            element={<MedicineCategoriesPage />}
                        />

                        <Route
                            path="medicines/suppliers"
                            element={<SuppliersPage />}
                        />

                        <Route
                            path="medicines/inventory"
                            element={<InventoryPage />}
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
