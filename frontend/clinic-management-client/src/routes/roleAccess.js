export const INTERNAL_ROLES = [
    "Admin",
    "Doctor",
    "DepartmentHead",
    "Receptionist",
    "LabTechnician",
];

export const ROLE_LABELS = {
    Admin: "Quản trị viên",
    Doctor: "Bác sĩ",
    DepartmentHead: "Trưởng khoa",
    Receptionist: "Lễ tân",
    Patient: "Bệnh nhân",
    LabTechnician: "Kỹ thuật viên xét nghiệm",
};

export const INTERNAL_PAGES = [
    { label: "Tổng quan", path: "/internal/dashboard", roles: INTERNAL_ROLES },
    { label: "Lịch hẹn", path: "/internal/appointments", roles: ["Admin", "Receptionist"] },
    { label: "Tài khoản & Vai trò", path: "/internal/users", roles: ["Admin"] },
    { label: "Vai trò & Phân quyền", path: "/internal/roles-permissions", roles: ["Admin"] },
    { label: "Khoa", path: "/internal/departments", roles: ["Admin"] },
    { label: "Chuyên khoa", path: "/internal/specializations", roles: ["Admin"] },
    { label: "Phòng", path: "/internal/rooms", roles: ["Admin"] },
    { label: "Lịch bác sĩ", path: "/internal/doctor-schedules", roles: ["Admin"] },
    { label: "Đăng ký ca làm việc", path: "/internal/doctor/schedule-requests", roles: ["Doctor", "DepartmentHead"] },
    { label: "Duyệt ca khám", path: "/internal/schedule-requests", roles: ["Admin", "DepartmentHead"] },
    { label: "Kho dược & Vật tư", path: "/internal/medicines", roles: ["Admin"] },
    { label: "Xét nghiệm", path: "/internal/lab-test-types", roles: ["Admin", "Doctor", "DepartmentHead"] },
    { label: "Chỉ định xét nghiệm", path: "/internal/doctor/lab-orders", roles: ["Doctor", "DepartmentHead"] },
    { label: "Hàng chờ xét nghiệm", path: "/internal/technician/lab-queue", roles: ["LabTechnician"] },
];

// These routes are available from page flows, but do not belong in the sidebar.
const ADDITIONAL_INTERNAL_ROUTES = [
    { path: "/internal/diseases", roles: ["Admin", "Doctor", "DepartmentHead"] },
    { path: "/internal/examinations", roles: ["Doctor", "DepartmentHead"] },
];

const PAGE_PERMISSIONS = {
    "/internal/appointments": "appointments.view",
    "/internal/users": "accounts.view",
    "/internal/roles-permissions": "accounts.manageRoles",
    "/internal/departments": "catalog.manage",
    "/internal/specializations": "catalog.manage",
    "/internal/rooms": "catalog.manage",
    "/internal/doctor-schedules": "schedules.manage",
    "/internal/schedule-requests": "schedules.review",
    "/internal/medicines": "pharmacy.manageCatalog",
    "/internal/lab-test-types": "labs.viewTypes",
    "/internal/doctor/lab-orders": "labs.order",
    "/internal/doctor/schedule-requests": null,
    "/internal/technician/lab-queue": "labs.viewPending",
    "/internal/diseases": "clinical.manageDiseases",
    "/internal/examinations": "clinical.viewAssigned",
};

const asUser = value => typeof value === "string" ? { role: value } : value || {};

export function redirectForProtectedRoute(user, path, { allowedRoles = [], allowedPermissions = [], allowInternal = false } = {}) {
    if (!user.isAuthenticated) return path.startsWith("/internal") ? "/internal/login" : "/login";
    const permissions = user.permissions || [];
    if ((allowedRoles.length > 0 && !allowedRoles.includes(user.role)) ||
        (allowedPermissions.length > 0 && !allowedPermissions.some(code => permissions.includes(code))) ||
        (allowInternal && !(INTERNAL_ROLES.includes(user.role) || (user.role !== "Patient" && permissions.length > 0))))
        return "/403";
    return null;
}

export function canSeePage(value, page) {
    const user = asUser(value);
    if (Array.isArray(user.permissions)) {
        const permission = PAGE_PERMISSIONS[page.path];
        if (permission?.startsWith("accounts.") && user.role !== "Admin") return false;
        if (page.path === "/internal/schedule-requests" && !page.roles.includes(user.role)) return false;
        return user.role !== "Patient" && (!permission || user.permissions.includes(permission));
    }
    return page.roles.includes(user.role);
}

export const homeForRole = (value) =>
    asUser(value).role === "Patient"
        ? "/booking"
        : asUser(value).role === "LabTechnician"
        ? "/internal/technician/lab-queue"
        : (INTERNAL_ROLES.includes(asUser(value).role) || asUser(value).permissions?.length)
        ? "/internal/dashboard"
        : "/unauthorized";

export function canAccessPath(value, path) {
    const user = asUser(value);
    if (path === "/booking" || path === "/lab-results") {
        return user.role === "Patient";
    }

    if (!path.startsWith("/internal")) {
        return true;
    }

    const page = [...INTERNAL_PAGES, ...ADDITIONAL_INTERNAL_ROUTES].find(
        (item) =>
            path === item.path ||
            path.startsWith(`${item.path}/`)
    );

    return Boolean(page && canSeePage(user, page));
}
