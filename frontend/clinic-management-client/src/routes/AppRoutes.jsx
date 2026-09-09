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

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PatientLayout />}>
                    <Route
                        path="/"
                        element={
                            <div>
                                Clinic Management
                            </div>
                        }
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
                </Route>

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

                <Route
                    path="/unauthorized"
                    element={
                        <div>
                            You are not authorized.
                        </div>
                    }
                />

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