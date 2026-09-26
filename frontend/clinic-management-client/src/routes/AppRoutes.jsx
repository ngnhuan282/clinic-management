import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import PatientLayout from "../layouts/PatientLayout";
import InternalLayout from "../layouts/InternalLayout";
import ProtectedRoute from "./ProtectedRoute";
import { INTERNAL_ROLES } from "./roleAccess";
import HomePage from "../pages/patient/HomePage";
import BookingPage from "../pages/patient/BookingPage";
import InventoryPage from "../pages/internal/admin/InventoryPage";
import MedicineCategoriesPage from "../pages/internal/admin/MedicineCategoriesPage";
import MedicinesPage from "../pages/internal/admin/MedicinesPage";
import SuppliersPage from "../pages/internal/admin/SuppliersPage";
import CatalogManagementPage from "../pages/internal/CatalogManagementPage";
import LabTestTypesPage from "../pages/internal/LabTestTypesPage";
import UsersPage from "../pages/internal/admin/UsersPage";
import DashboardPage from "../pages/internal/DashboardPage";
import AuthPage from "../pages/auth/AuthPage";
import DoctorLabOrdersPage from '../pages/internal/doctor/DoctorLabOrdersPage';
import TechnicianLabQueuePage from '../pages/internal/technician/TechnicianLabQueuePage';
export default function AppRoutes() {
    return <BrowserRouter><Routes>
        <Route element={<PatientLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage key="login" />} />
            <Route path="/internal/login" element={<AuthPage key="internal" internal />} />
            <Route path="/register" element={<AuthPage key="register" register />} />
            <Route path="/patient-portal" element={<Navigate to="/login" replace />} />
            <Route element={<ProtectedRoute allowedRoles={["Patient"]} />}>
                <Route path="/booking" element={<BookingPage />} />
            </Route>
            <Route path="/unauthorized" element={<Box sx={{ py: 8, px: 3, textAlign: "center" }}>
                <Typography variant="h3" component="h1">Không có quyền truy cập</Typography>
                <Typography color="text.secondary" sx={{ my: 2 }}>Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này.</Typography>
                <Button component={Link} to="/" variant="contained">Về trang chủ</Button>
            </Box>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={INTERNAL_ROLES} />}>
            <Route path="/internal" element={<InternalLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                    <Route path="users" element={<UsersPage />} />
                    <Route path="departments" element={<CatalogManagementPage resource="departments" />} />
                    <Route path="specializations" element={<CatalogManagementPage resource="specializations" />} />
                    <Route path="rooms" element={<CatalogManagementPage resource="rooms" />} />
                    <Route path="medicines" element={<MedicinesPage />} />
                    <Route path="medicines/categories" element={<MedicineCategoriesPage />} />
                    <Route path="medicines/suppliers" element={<SuppliersPage />} />
                    <Route path="medicines/inventory" element={<InventoryPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["Admin", "Doctor"]} />}>
                    <Route path="lab-test-types" element={<LabTestTypesPage />} />
                    <Route path="doctor/lab-orders" element={<DoctorLabOrdersPage />} />
                </Route>
             {/* Admin & Technician */}
                     <Route element={<ProtectedRoute allowedRoles={["Admin", "Technician"]} />}>
                            <Route path="technician/lab-queue" element={<TechnicianLabQueuePage />} />
                        </Route>



            </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></BrowserRouter>;
}
