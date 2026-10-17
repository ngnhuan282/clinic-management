import { getPrescriptionTextError } from "../validators/prescriptionValidator.js";

export const STOCK_REVIEW_OUTCOMES = {
    Kept: "Giữ nguyên đơn",
    Applied: "Đã điều chỉnh đơn",
    AwaitingBilling: "Chờ đối soát hóa đơn",
};

function normalizePrescription(prescription) {
    return [(prescription.notes || "").trim(), prescription.details.map(item => [Number(item.medicineId), Number(item.quantity), item.dosage.trim(), item.instructions.trim()])
        .sort((left, right) => left[0] - right[0])];
}

export function validateStockReviewDecision(form, prescription, latestDecision) {
    if (latestDecision) return "Yêu cầu rà soát này đã được bác sĩ phản hồi.";
    const reason = form.reason.trim();
    if (reason.length < 3 || reason.length > 2000) return "Lý do xử lý cần từ 3 đến 2000 ký tự.";
    if (form.action === "KeepPrescription") return "";
    if (form.action !== "AdjustPrescription") return "Vui lòng chọn phương án xử lý.";
    if (!form.details.length) return "Đơn điều chỉnh phải có ít nhất một thuốc.";
    const ids = new Set();
    for (const [index, item] of form.details.entries()) {
        if (!Number.isSafeInteger(Number(item.medicineId)) || Number(item.medicineId) <= 0 || ids.has(Number(item.medicineId)))
            return "Thuốc không hợp lệ hoặc bị trùng trong đơn.";
        ids.add(Number(item.medicineId));
        if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0 || Number(item.quantity) > 2147483647)
            return `Thuốc ${index + 1}: số lượng phải là số nguyên dương.`;
        if (!item.dosage.trim() || !item.instructions.trim()) return `Thuốc ${index + 1}: cần nhập liều dùng và hướng dẫn.`;
        const error = getPrescriptionTextError("dosage", item.dosage) || getPrescriptionTextError("instructions", item.instructions);
        if (error) return `Thuốc ${index + 1}: ${error}`;
    }
    const notesError = getPrescriptionTextError("notes", form.notes);
    if (notesError) return notesError;
    if (JSON.stringify(normalizePrescription(form)) === JSON.stringify(normalizePrescription(prescription)))
        return "Đơn chưa có thay đổi. Chọn giữ nguyên đơn để gửi phản hồi.";
    return "";
}
