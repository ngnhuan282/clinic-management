export function toPatientProfileForm(profile) {
    return {
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
        identityNumber: profile.identityNumber ?? "",
        insuranceCode: profile.insuranceCode ?? "",
    };
}

export function toPatientProfilePayload(form) {
    return {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate || null,
        identityNumber: form.identityNumber.trim() || null,
        insuranceCode: form.insuranceCode.trim() || null,
    };
}

export function validatePatientProfileForm(form) {
    const errors = {};
    if (!form.fullName.trim() || form.fullName.trim().length > 100) errors.fullName = "Nhập họ tên, tối đa 100 ký tự.";
    if (!form.phone.trim() || form.phone.trim().length > 15) errors.phone = "Nhập số điện thoại, tối đa 15 ký tự.";
    if (form.identityNumber.trim().length > 20) errors.identityNumber = "Số CCCD/CMND tối đa 20 ký tự.";
    if (form.insuranceCode.trim().length > 30) errors.insuranceCode = "Mã thẻ BHYT tối đa 30 ký tự.";
    return errors;
}
