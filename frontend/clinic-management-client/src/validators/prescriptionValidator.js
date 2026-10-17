export const PRESCRIPTION_TEXT_LIMITS = Object.freeze({
    dosage: 100,
    instructions: 255,
    notes: 1000,
});

const fieldLabels = {
    dosage: "Liều dùng",
    instructions: "Hướng dẫn",
    notes: "Lời dặn bác sĩ",
};

export function getPrescriptionTextError(field, value) {
    const limit = PRESCRIPTION_TEXT_LIMITS[field];
    return String(value ?? "").length > limit
        ? `${fieldLabels[field]} không được vượt quá ${limit} ký tự.`
        : "";
}
