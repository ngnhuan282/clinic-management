export const VITAL_SIGN_FIELDS = [
    { key: "temperature", label: "Nhiệt độ", unit: "°C", decimals: 1, max: 999.9, step: 0.1 },
    { key: "bloodPressure", label: "Huyết áp", unit: "mmHg" },
    { key: "weightKg", label: "Cân nặng", unit: "kg", decimals: 2, max: 999.99, step: 0.01 },
    { key: "heightCm", label: "Chiều cao", unit: "cm", decimals: 2, max: 999.99, step: 0.01 },
];

function normalizeMeasurement(value) {
    if (value == null || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : String(value).trim();
}

export function normalizeVitalSigns(source = {}) {
    return Object.fromEntries(VITAL_SIGN_FIELDS.map(({ key }) => [key,
        key === "bloodPressure"
            ? String(source?.[key] ?? "").split("/").map(part => part.trim()).join("/") || null
            : normalizeMeasurement(source?.[key]),
    ]));
}

export function getVitalSignError(key, value) {
    const field = VITAL_SIGN_FIELDS.find(item => item.key === key);
    const normalized = normalizeVitalSigns({ [key]: value })[key];
    if (normalized == null) return "";
    if (key === "bloodPressure") {
        return /^[1-9][0-9]{0,2}\/[1-9][0-9]{0,2}$/.test(normalized)
            ? "" : "Huyết áp cần có dạng 120/80, mỗi số từ 1 đến 999.";
    }
    if (!Number.isFinite(normalized) || normalized <= 0 || normalized > field.max) {
        return `${field.label} phải lớn hơn 0 và không vượt ${field.max} ${field.unit}.`;
    }
    return Number(normalized.toFixed(field.decimals)) === normalized
        ? "" : `${field.label} chỉ nhận tối đa ${field.decimals} chữ số thập phân.`;
}

export function getVitalSignsError(source = {}) {
    return VITAL_SIGN_FIELDS.map(({ key }) => getVitalSignError(key, source[key])).find(Boolean) || "";
}

export function getVitalSignReadings(source = {}) {
    const values = normalizeVitalSigns(source);
    return VITAL_SIGN_FIELDS.map(field => ({
        key: field.key,
        label: field.label,
        value: values[field.key] == null ? "Chưa ghi nhận"
            : `${typeof values[field.key] === "number"
                ? values[field.key].toLocaleString("vi-VN", { maximumFractionDigits: field.decimals })
                : values[field.key]} ${field.unit}`,
    }));
}
