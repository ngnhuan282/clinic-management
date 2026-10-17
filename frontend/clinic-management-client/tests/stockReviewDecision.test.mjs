import test from "node:test";
import assert from "node:assert/strict";
import { validateStockReviewDecision } from "../src/utils/stockReviewDecision.js";

const prescription = { notes: "Theo dõi", details: [{ medicineId: 1, quantity: 20, dosage: "Sáng 1 viên", instructions: "Sau ăn" }] };
const form = () => ({ action: "AdjustPrescription", reason: "Kho thiếu thuốc", notes: "Theo dõi", details: [{ ...prescription.details[0], quantity: 12 }] });

test("keep response needs a meaningful reason but no edited medicines", () => {
    assert.equal(validateStockReviewDecision({ action: "KeepPrescription", reason: "Tiếp tục theo đơn" }, prescription), "");
    assert.match(validateStockReviewDecision({ action: "KeepPrescription", reason: "   " }, prescription), /Lý do/);
    assert.match(validateStockReviewDecision({ action: "KeepPrescription", reason: "a".repeat(2001) }, prescription), /Lý do/);
});
test("adjustment accepts valid reduction and rejects unchanged prescription", () => {
    assert.equal(validateStockReviewDecision(form(), prescription), "");
    assert.match(validateStockReviewDecision({ ...form(), details: prescription.details }, prescription), /chưa có thay đổi/);
});
test("quantity must be a positive bounded integer", () => {
    for (const quantity of [0, -1, 1.5, "x", 2147483648])
        assert.match(validateStockReviewDecision({ ...form(), details: [{ ...form().details[0], quantity }] }, prescription), /số nguyên dương/);
});
test("medicine edits reject empty, duplicate and invalid medicine IDs", () => {
    assert.match(validateStockReviewDecision({ ...form(), details: [] }, prescription), /ít nhất/);
    assert.match(validateStockReviewDecision({ ...form(), details: [form().details[0], form().details[0]] }, prescription), /trùng/);
    assert.match(validateStockReviewDecision({ ...form(), details: [{ ...form().details[0], medicineId: -1 }] }, prescription), /không hợp lệ/);
});
test("directions respect existing prescription limits", () => {
    for (const [field, length] of [["dosage", 101], ["instructions", 256]])
        assert.match(validateStockReviewDecision({ ...form(), details: [{ ...form().details[0], [field]: "a".repeat(length) }] }, prescription), /vượt quá/);
    assert.match(validateStockReviewDecision({ ...form(), notes: "a".repeat(1001) }, prescription), /vượt quá/);
    assert.match(validateStockReviewDecision({ ...form(), details: [{ ...form().details[0], dosage: " " }] }, prescription), /cần nhập/);
});
test("reordered items and trimmed whitespace are not clinical changes", () => {
    const second = { medicineId: 2, quantity: 3, dosage: "1 viên", instructions: "Sau ăn" };
    const existing = { ...prescription, details: [...prescription.details, second] };
    assert.match(validateStockReviewDecision({ ...form(), notes: " Theo dõi ", details: [second, prescription.details[0]] }, existing), /chưa có thay đổi/);
});

test("any existing decision locks the whole review, not only duplicate keep", () => {
    const latest = { action: "KeepPrescription", before: prescription, after: prescription };
    const keep = { action: "KeepPrescription", reason: "Một lý do khác" };
    assert.match(validateStockReviewDecision(keep, prescription, latest), /đã được bác sĩ phản hồi/);
    assert.match(validateStockReviewDecision(form(), prescription, latest), /đã được bác sĩ phản hồi/);
    assert.equal(validateStockReviewDecision(keep, prescription), "");
    const changed = { ...prescription, details: [{ ...prescription.details[0], quantity: 12 }] };
    assert.match(validateStockReviewDecision(keep, changed, latest), /đã được bác sĩ phản hồi/);
});

test("submitted proposals cannot be revised or withdrawn through a second response", () => {
    const latest = { action: "AdjustPrescription", before: prescription, after: form() };
    assert.match(validateStockReviewDecision(form(), prescription, latest), /đã được bác sĩ phản hồi/);
    for (const change of [{ quantity: 10 }, { dosage: "Chiều 1 viên" }, { instructions: "Trước ăn" }, { medicineId: 2 }])
        assert.match(validateStockReviewDecision({ ...form(), details: [{ ...form().details[0], ...change }] }, prescription, latest), /đã được bác sĩ phản hồi/);
    assert.match(validateStockReviewDecision({ ...form(), notes: "Theo dõi thêm" }, prescription, latest), /đã được bác sĩ phản hồi/);
    const keep = { action: "KeepPrescription", reason: "Rút phương án, giữ đơn hiện tại" };
    assert.match(validateStockReviewDecision(keep, prescription, latest), /đã được bác sĩ phản hồi/);
});
