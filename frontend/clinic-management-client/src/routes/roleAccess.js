export const INTERNAL_ROLES = [
    "Admin",
    "Doctor",
    "Receptionist",
    "LabTechnician",
];

export const ROLE_LABELS = {
    Admin: "Quản trị viên",
    Doctor: "Bác sĩ",
    Receptionist: "Lễ tân",
    Patient: "Bệnh nhân",
    LabTechnician: "Kỹ thuật viên xét nghiệm",
};

export const INTERNAL_PAGES = [
    { label: "Tổng quan", path: "/internal/dashboard", roles: INTERNAL_ROLES },
    { label: "Lịch hẹn", path: "/internal/appointments", roles: ["Admin", "Receptionist"] },
    { label: "Tài khoản & Vai trò", path: "/internal/users", roles: ["Admin"] },
    { label: "Khoa", path: "/internal/departments", roles: ["Admin"] },
    { label: "Chuyên khoa", path: "/internal/specializations", roles: ["Admin"] },
    { label: "Phòng", path: "/internal/rooms", roles: ["Admin"] },
    { label: "Lịch bác sĩ", path: "/internal/doctor-schedules", roles: ["Admin"] },
    { label: "Kho dược & Vật tư", path: "/internal/medicines", roles: ["Admin"] },
    { label: "Xét nghiệm", path: "/internal/lab-test-types", roles: ["Admin", "Doctor"] },
    { label: "Chỉ định xét nghiệm", path: "/internal/doctor/lab-orders", roles: ["Doctor"] },
    { label: "Hàng chờ xét nghiệm", path: "/internal/technician/lab-queue", roles: ["LabTechnician"] },
];

export const homeForRole = (role) =>
    role === "LabTechnician"
        ? "/internal/technician/lab-queue"
        : INTERNAL_ROLES.includes(role)
        ? "/internal/dashboard"
        : "/booking";

export function canAccessPath(role, path) {
    if (path === "/booking" || path === "/lab-results") {
        return role === "Patient";
    }

    if (!path.startsWith("/internal")) {
        return true;
    }

    const page = INTERNAL_PAGES.find(
        (item) =>
            path === item.path ||
            path.startsWith(`${item.path}/`)
    );

    return Boolean(page?.roles.includes(role));
}
