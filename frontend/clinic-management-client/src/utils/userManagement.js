import { ROLE_LABELS } from "../routes/roleAccess.js";

export function validateUserProfile(values) {
    const errors = {};
    if (!values.fullName.trim() || values.fullName.trim().length > 100) errors.fullName = "Nhập họ tên, tối đa 100 ký tự.";
    if (values.email.trim() && (values.email.trim().length > 100 || !/^[^\s@]+@[^\s@]+$/.test(values.email.trim()))) errors.email = "Địa chỉ email không hợp lệ.";
    if (values.phone.trim() && (values.phone.trim().length > 15 || !/^\+?[\d\s().-]+$/.test(values.phone.trim()))) errors.phone = "Số điện thoại không hợp lệ, tối đa 15 ký tự.";
    return errors;
}

export function validateStaffUser(values, roleName) {
    const errors = validateUserProfile(values);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,49}$/.test(values.username.trim())) errors.username = "Dùng 3–50 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.";
    if (!values.password.trim() || values.password.length < 8 || new TextEncoder().encode(values.password).length > 72 || values.password.includes("\0")) errors.password = "Mật khẩu từ 8 ký tự, tối đa 72 byte UTF-8.";
    if (!roleName || roleName === "Patient") errors.roleId = "Vui lòng chọn vai trò nhân viên.";
    if (["Doctor", "DepartmentHead"].includes(roleName) && !values.doctorId) errors.doctorId = "Vui lòng chọn hồ sơ bác sĩ chưa liên kết.";
    return errors;
}

export function userCsvCell(value) {
    const text = String(value ?? "");
    const safe = /^[\s]*[=+\-@]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

export function usersToCsv(users) {
    const rows = [["Tên đăng nhập", "Họ và tên", "Email", "Số điện thoại", "Vai trò", "Trạng thái"]];
    for (const user of users) rows.push([user.username, user.fullName, user.email, user.phone,
        ROLE_LABELS[user.role] || user.role, user.status ? "Hoạt động" : "Đã khóa"]);
    return "\uFEFF" + rows.map(row => row.map(userCsvCell).join(",")).join("\r\n");
}
