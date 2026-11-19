export const INTERNAL_ROLES = [
    "Admin",
    "Doctor",
    "DepartmentHead",
    "Receptionist",
    "LabTechnician",
    "Pharmacist",
    "Cashier",
];

export const ROLE_LABELS = {
    Admin: "Quản trị viên",
    Doctor: "Bác sĩ",
    DepartmentHead: "Trưởng khoa",
    Receptionist: "Lễ tân",
    Patient: "Bệnh nhân",
    LabTechnician: "Kỹ thuật viên xét nghiệm",
    Pharmacist: "Dược sĩ",
    Cashier: "Thu ngân",
};

export const INTERNAL_PAGES = [
    // 1. Tổng quan (luôn đứng đầu tiên trong sidebar)
    { label: "Tổng quan", path: "/internal/dashboard", group: "Tổng quan", roles: INTERNAL_ROLES },

    // 2. Tiếp đón & Thu ngân
    { label: "Lịch hẹn", path: "/internal/appointments", group: "Tiếp đón & Thu ngân", roles: ["Admin", "Receptionist"] },
    { label: "Sổ khám bệnh", path: "/internal/patient-books", group: "Tiếp đón & Thu ngân", roles: ["Receptionist"] },
    { label: "Thu ngân", path: "/internal/cashier/billing", group: "Tiếp đón & Thu ngân", roles: ["Admin", "Cashier"] },

    // 3. Khám bệnh & Lâm sàng
    { label: "Khám bệnh", path: "/internal/examinations", group: "Khám bệnh & Lâm sàng", roles: ["Doctor", "DepartmentHead"] },
    { label: "Chỉ định xét nghiệm", path: "/internal/doctor/lab-orders", group: "Khám bệnh & Lâm sàng", roles: ["Doctor", "DepartmentHead"] },
    { label: "Hàng chờ xét nghiệm", path: "/internal/technician/lab-queue", group: "Khám bệnh & Lâm sàng", roles: ["LabTechnician"] },
    { label: "Rà soát thuốc thiếu", path: "/internal/doctor/stock-reviews", group: "Khám bệnh & Lâm sàng", roles: ["Doctor", "DepartmentHead"] },
    { label: "Đăng ký ca làm việc", path: "/internal/doctor/schedule-requests", group: "Khám bệnh & Lâm sàng", roles: ["Doctor", "DepartmentHead"] },
    { label: "Lịch làm việc của khoa", path: "/internal/department-schedules", group: "Khám bệnh & Lâm sàng", roles: ["DepartmentHead"] },
    { label: "Thống kê khoa", path: "/internal/department-statistics", group: "Khám bệnh & Lâm sàng", roles: ["DepartmentHead"] },

    // 4. Lịch trực & Danh mục y tế
    { label: "Lịch bác sĩ", path: "/internal/doctor-schedules", group: "Lịch trực & Danh mục", roles: ["Admin"] },
    { label: "Duyệt ca khám", path: "/internal/schedule-requests", group: "Lịch trực & Danh mục", roles: ["Admin", "DepartmentHead"] },
    { label: "Khoa", path: "/internal/departments", group: "Lịch trực & Danh mục", roles: ["Admin"] },
    { label: "Chuyên khoa", path: "/internal/specializations", group: "Lịch trực & Danh mục", roles: ["Admin"] },
    { label: "Phòng", path: "/internal/rooms", group: "Lịch trực & Danh mục", roles: ["Admin"] },
    { label: "Danh mục bệnh", path: "/internal/diseases", group: "Lịch trực & Danh mục", roles: ["Admin", "DepartmentHead"] },
    { label: "Xét nghiệm", path: "/internal/lab-test-types", group: "Lịch trực & Danh mục", roles: ["Admin", "Doctor", "DepartmentHead"] },
    { label: "Vị trí công việc", path: "/internal/job-positions", group: "Lịch trực & Danh mục", roles: ["Admin"] },

    // 5. Kho dược & Cấp phát
    {
        label: "Quầy cấp thuốc",
        path: "/internal/pharmacy/dispensing",
        group: "Kho dược & Cấp phát",
        roles: ["Admin", "Pharmacist"],
    },
    {
        label: "Kho dược & Vật tư",
        path: "/internal/medicines",
        to: "/internal/medicines/purchase-orders",
        group: "Kho dược & Cấp phát",
        roles: ["Admin"],
    },
    {
        label: "Tồn kho",
        path: "/internal/pharmacy/inventory",
        group: "Kho dược & Cấp phát",
        roles: ["Pharmacist"],
    },

    // 6. Quản trị hệ thống
    { label: "Tài khoản & Vai trò", path: "/internal/users", group: "Quản trị hệ thống", roles: ["Admin"] },
    { label: "Hồ sơ bác sĩ (Quản trị)", path: "/internal/doctors-management", group: "Quản trị hệ thống", roles: ["Admin"] },
    { label: "Hồ sơ nhân viên", path: "/internal/staff-management", group: "Quản trị hệ thống", roles: ["Admin"] },
    { label: "Vai trò & Phân quyền", path: "/internal/roles-permissions", group: "Quản trị hệ thống", roles: ["Admin"] },
    { label: "Quản lý đánh giá", path: "/internal/reviews", group: "Quản trị hệ thống", roles: ["Admin"] },
    { label: "Cấu hình phòng khám", path: "/internal/settings", group: "Quản trị hệ thống", roles: ["Admin"] },

    // 7. Cá nhân
    { label: "Hồ sơ bác sĩ", path: "/internal/doctor/profile", group: "Cá nhân", roles: ["Doctor", "DepartmentHead"] },
    { label: "Hồ sơ cá nhân", path: "/internal/profile", group: "Cá nhân", roles: INTERNAL_ROLES },
];

const ADDITIONAL_INTERNAL_ROUTES = [];

const PAGE_PERMISSIONS = {
    "/internal/cashier/billing": "billing.view",
    "/internal/department-statistics": "reports.departmentStatistics",
    "/internal/department-schedules": "schedules.viewDepartment",
    "/internal/appointments": "appointments.view",
    "/internal/patient-books": "appointments.checkIn",
    "/internal/users": "accounts.view",
    "/internal/doctors-management": "staff.manage",
    "/internal/staff-management": "staff.manage",
    "/internal/roles-permissions": "accounts.manageRoles",
    "/internal/departments": "catalog.manage",
    "/internal/specializations": "catalog.manage",
    "/internal/rooms": "catalog.manage",
    "/internal/job-positions": "catalog.manage",
    "/internal/doctor-schedules": "schedules.manage",
    "/internal/schedule-requests": "schedules.review",
    "/internal/medicines": [
        "pharmacy.manageCatalog",
        "pharmacy.manageInventory",
    ],
    "/internal/pharmacy/dispensing": "pharmacy.dispense",
    "/internal/pharmacy/inventory": "pharmacy.viewInventory",
    "/internal/lab-test-types": "labs.viewTypes",
    "/internal/doctor/lab-orders": "labs.order",
    "/internal/doctor/schedule-requests": null,
    "/internal/doctor/profile": null,
    "/internal/technician/lab-queue": "labs.viewPending",
    "/internal/diseases": "clinical.manageDiseases",
    "/internal/examinations": "clinical.viewAssigned",
    "/internal/doctor/stock-reviews": "pharmacy.prescribe",
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
        const requiredPermissions = Array.isArray(permission)
            ? permission
            : permission
            ? [permission]
            : [];
        if (requiredPermissions.some(code => code.startsWith("accounts.")) && user.role !== "Admin") return false;
        if (page.path === "/internal/schedule-requests" && !page.roles.includes(user.role)) return false;
        if (["/internal/reviews", "/internal/settings", "/internal/cashier/billing"].includes(page.path) && !page.roles.includes(user.role)) return false;
        if (["/internal/department-schedules", "/internal/department-statistics"].includes(page.path) && user.role !== "DepartmentHead") return false;
        if (page.path === "/internal/diseases" && !page.roles.includes(user.role)) return false;
        if (page.path === "/internal/pharmacy/inventory" && !page.roles.includes(user.role)) return false;
        if (page.path === "/internal/doctor/stock-reviews" && !page.roles.includes(user.role)) return false;
        if (page.path === "/internal/doctor/profile" && !page.roles.includes(user.role)) return false;
        return user.role !== "Patient" && (
            requiredPermissions.length === 0 ||
            requiredPermissions.some(code => user.permissions.includes(code))
        );
    }
    return page.roles.includes(user.role);
}

export const homeForRole = (value) =>
    asUser(value).role === "Patient"
        ? "/booking"
        : asUser(value).role === "Pharmacist"
        ? "/internal/pharmacy/dispensing"
        : asUser(value).role === "LabTechnician"
        ? "/internal/technician/lab-queue"
        : asUser(value).role === "Cashier"
        ? asUser(value).permissions?.includes("billing.view") ? "/internal/cashier/billing" : "/internal/profile"
        : (INTERNAL_ROLES.includes(asUser(value).role) || asUser(value).permissions?.length)
        ? "/internal/dashboard"
        : "/unauthorized";

export function canAccessPath(value, path) {
    const user = asUser(value);
    if (path === "/profile") return user.isAuthenticated || Boolean(user.role);
    if (["/booking", "/lab-results", "/my-reviews", "/medical-records"].includes(path)
        || path.startsWith("/medical-records/")) {
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
