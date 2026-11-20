export function validateStaffForm(values) {
    const errors = {};
    if (!values.fullName.trim() || values.fullName.trim().length > 100) errors.fullName = "Nhập họ tên, tối đa 100 ký tự.";
    if (!values.jobPositionId) errors.jobPositionId = "Vui lòng chọn vị trí công việc.";
    return errors;
}
