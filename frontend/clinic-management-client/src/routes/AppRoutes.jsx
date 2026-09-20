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
import InventoryPage from "../pages/internal/admin/InventoryPage";
import MedicineCategoriesPage from "../pages/internal/admin/MedicineCategoriesPage";
import MedicinesPage from "../pages/internal/admin/MedicinesPage";
import SuppliersPage from "../pages/internal/admin/SuppliersPage";
import CatalogManagementPage from "../pages/internal/CatalogManagementPage";
import LabTestTypesPage from "../pages/internal/LabTestTypesPage";
import AuthPage from "../pages/auth/AuthPage";

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
                            <AuthPage key="login" />
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <AuthPage key="register" register />
                        }
                    />

                    <Route element={<ProtectedRoute allowedRoles={["Patient"]} />}>
                        <Route path="/booking" element={<BookingPage />} />
                    </Route>

                    {/* Test Backend */}
                    <Route
                        path="/test-backend"
                        element={<BackendTestPage />}
                    />

                </Route>

                {/* =========================
                    Internal sign-in
                ========================= */}
                <Route path="/internal/login" element={<AuthPage />} />

                {/* =========================
                    Internal Routes (Protected)
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
                        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                            <Route path="departments" element={<CatalogManagementPage resource="departments" />} />
                            <Route path="specializations" element={<CatalogManagementPage resource="specializations" />} />
                            <Route path="rooms" element={<CatalogManagementPage resource="rooms" />} />

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
                        <Route element={<ProtectedRoute allowedRoles={["Admin", "Doctor"]} />}>
                            <Route path="lab-test-types" element={<LabTestTypesPage />} />
                        </Route>
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
