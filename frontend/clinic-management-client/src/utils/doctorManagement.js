export function validateDoctorForm(values) {
    const errors = {};
    if (!values.fullName.trim() || values.fullName.trim().length > 100) errors.fullName = "Nhập họ tên, tối đa 100 ký tự.";
    if (!values.title.trim() || values.title.trim().length > 50) errors.title = "Nhập học vị/chức danh, tối đa 50 ký tự.";
    const experience = Number(values.experienceYears);
    if (values.experienceYears === "" || !Number.isInteger(experience) || experience < 0 || experience > 70)
        errors.experienceYears = "Số năm kinh nghiệm từ 0 đến 70.";
    if (values.biography.trim().length > 500) errors.biography = "Giới thiệu tối đa 500 ký tự.";
    if (!values.departmentId) errors.departmentId = "Vui lòng chọn khoa.";
    if (!values.specializationId) errors.specializationId = "Vui lòng chọn chuyên khoa.";
    return errors;
}
