import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    Link,
    useLocation,
} from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

import PatientLayout from "../layouts/PatientLayout";
import InternalLayout from "../layouts/InternalLayout";
import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/patient/HomePage";
import BookingPage from "../pages/patient/BookingPage";
import LabResultsPage from "../pages/patient/LabResultsPage";
import DoctorSearchPage from "../pages/patient/DoctorSearchPage";
import PatientProfilePage from "../pages/patient/PatientProfilePage";
import AuthPage from "../pages/auth/AuthPage";

import InventoryPage from "../pages/internal/admin/InventoryPage";
import MedicineCategoriesPage from "../pages/internal/admin/MedicineCategoriesPage";
import MedicinesPage from "../pages/internal/admin/MedicinesPage";
import SuppliersPage from "../pages/internal/admin/SuppliersPage";
import UsersPage from "../pages/internal/admin/UsersPage";
import RolesPermissionsPage from "../pages/internal/admin/RolesPermissionsPage";

import CatalogManagementPage from "../pages/internal/CatalogManagementPage";
import LabTestTypesPage from "../pages/internal/LabTestTypesPage";
import DiseasesPage from "../pages/internal/DiseasesPage";
import DashboardPage from "../pages/internal/DashboardPage";
import AppointmentsPage from "../pages/internal/AppointmentsPage";
import DoctorScheduleManagementPage from "../pages/internal/DoctorScheduleManagementPage";
import ScheduleReviewPage from "../pages/internal/ScheduleReviewPage";
import DepartmentSchedulesPage from "../pages/internal/DepartmentSchedulesPage";
import CashierBillingPage from "../pages/internal/CashierBillingPage";

import DoctorLabOrdersPage from "../pages/internal/doctor/DoctorLabOrdersPage";
import DoctorAppointmentsPage from "../pages/internal/doctor/DoctorAppointmentsPage";
import MedicalRecordDetailPage from "../pages/internal/doctor/MedicalRecordDetailPage";
import MedicalRecordPage from "../pages/internal/doctor/MedicalRecordPage";
import PrescriptionPage from "../pages/internal/doctor/PrescriptionPage";
import DoctorScheduleRequestPage from "../pages/internal/doctor/DoctorScheduleRequestPage";
import DoctorProfilePage from "../pages/internal/doctor/DoctorProfilePage";
import PatientBooksPage from "../pages/internal/PatientBooksPage";

import TechnicianLabQueuePage from "../pages/internal/technician/TechnicianLabQueuePage";

function UnauthorizedPage() {
    const { state } = useLocation();
    const rolesPage = state?.deniedPath === "/internal/roles-permissions";

    return (
        <Box sx={{ py: 8, px: 3, textAlign: "center" }} role="alert">
            <Typography variant="h3" component="h1">
                Không có quyền truy cập
            </Typography>

            <Typography color="text.secondary" sx={{ my: 2 }}>
                {rolesPage
                    ? "Chỉ quản trị viên được truy cập trang Vai trò và phân quyền. Hãy liên hệ quản trị viên nếu bạn cần quyền sử dụng."
                    : "Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này."}
            </Typography>

            <Button component={Link} to="/" variant="contained">
                Về trang chủ
            </Button>
        </Box>
    );
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PatientLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/doctors" element={<DoctorSearchPage />} />
                    <Route path="/login" element={<AuthPage key="login" />} />
                    <Route
                        path="/internal/login"
                        element={<AuthPage key="internal" internal />}
                    />
                    <Route
                        path="/register"
                        element={<AuthPage key="register" register />}
                    />
                    <Route
                        path="/patient-portal"
                        element={<Navigate to="/login" replace />}
                    />

                    <Route
                        element={<ProtectedRoute allowedRoles={["Patient"]} />}
                    >
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/lab-results" element={<LabResultsPage />} />
                        <Route path="/profile" element={<PatientProfilePage />} />
                    </Route>

                    <Route path="/403" element={<UnauthorizedPage />} />
                    <Route
                        path="/unauthorized"
                        element={<Navigate to="/403" replace />}
                    />
                </Route>

                <Route element={<ProtectedRoute allowInternal />}>
                    <Route path="/internal" element={<InternalLayout />}>
                        <Route
                            index
                            element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route element={<ProtectedRoute allowedRoles={["DepartmentHead"]} />}>
                            <Route path="department-schedules" element={<DepartmentSchedulesPage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["appointments.view"]}
                                />
                            }
                        >
                            <Route
                                path="appointments"
                                element={<AppointmentsPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["Admin"]}
                                    allowedPermissions={["accounts.view"]}
                                />
                            }
                        >
                            <Route path="users" element={<UsersPage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["Admin"]}
                                    allowedPermissions={["accounts.manageRoles"]}
                                />
                            }
                        >
                            <Route
                                path="roles-permissions"
                                element={<RolesPermissionsPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["catalog.manage"]}
                                />
                            }
                        >
                            <Route
                                path="departments"
                                element={
                                    <CatalogManagementPage resource="departments" />
                                }
                            />
                            <Route
                                path="specializations"
                                element={
                                    <CatalogManagementPage resource="specializations" />
                                }
                            />
                            <Route
                                path="rooms"
                                element={
                                    <CatalogManagementPage resource="rooms" />
                                }
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["schedules.manage"]}
                                />
                            }
                        >
                            <Route
                                path="doctor-schedules"
                                element={<DoctorScheduleManagementPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["Doctor", "DepartmentHead"]}
                                />
                            }
                        >
                            <Route
                                path="doctor/schedule-requests"
                                element={<DoctorScheduleRequestPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["appointments.checkIn"]}
                                />
                            }
                        >
                            <Route path="patient-books" element={<PatientBooksPage />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={["Doctor"]} />}>
                            <Route path="doctor/profile" element={<DoctorProfilePage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["Admin", "DepartmentHead"]}
                                    allowedPermissions={["schedules.review"]}
                                />
                            }
                        >
                            <Route
                                path="schedule-requests"
                                element={<ScheduleReviewPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["pharmacy.manageCatalog"]}
                                />
                            }
                        >
                            <Route path="medicines" element={<MedicinesPage />} />
                            <Route
                                path="medicines/categories"
                                element={<MedicineCategoriesPage />}
                            />
                            <Route
                                path="medicines/suppliers"
                                element={<SuppliersPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={[
                                        "pharmacy.manageInventory",
                                    ]}
                                />
                            }
                        >
                            <Route
                                path="medicines/inventory"
                                element={<InventoryPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["clinical.manageDiseases"]}
                                />
                            }
                        >
                            <Route path="diseases" element={<DiseasesPage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["labs.viewTypes"]}
                                />
                            }
                        >
                            <Route
                                path="lab-test-types"
                                element={<LabTestTypesPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["labs.viewPending"]}
                                />
                            }
                        >
                            <Route
                                path="technician/lab-queue"
                                element={<TechnicianLabQueuePage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["labs.order"]}
                                />
                            }
                        >
                            <Route
                                path="doctor/lab-orders"
                                element={<DoctorLabOrdersPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["Admin", "Cashier"]}
                                />
                            }
                        >
                            <Route
                                path="cashier/billing"
                                element={<CashierBillingPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["pharmacy.prescribe"]}
                                />
                            }
                        >
                            <Route
                                path="examinations/:appointmentId/prescription"
                                element={<PrescriptionPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedPermissions={["clinical.viewAssigned"]}
                                />
                            }
                        >
                            <Route
                                path="examinations"
                                element={<DoctorAppointmentsPage />}
                            />
                            <Route
                                path="examinations/:appointmentId/record"
                                element={<MedicalRecordDetailPage />}
                            />
                            <Route
                                path="examinations/:appointmentId"
                                element={<MedicalRecordPage />}
                            />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
