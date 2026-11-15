import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import getApiErrorMessage from "../src/utils/errorHandler.js";

const bookMessage = "Cần hoàn tất tiếp nhận và đối chiếu sổ khám tại quầy lễ tân trước khi bắt đầu khám.";
const apiError = (code, message, status = 400) => ({ response: { status, data: { code, message } } });

test("book verification errors use Vietnamese with or without a numeric API code", () => {
    const english = "An issued patient book must be verified before check-in";
    assert.equal(getApiErrorMessage(apiError(4005, english)), bookMessage);
    assert.equal(getApiErrorMessage(apiError(4005)), bookMessage);
    assert.equal(getApiErrorMessage(apiError(undefined, english)), bookMessage);
});

test("every business error referenced by owned clinic and pharmacy services has a translation", () => {
    const directory = new URL("../../../backend/ClinicManagement/", import.meta.url);
    const definitions = readFileSync(new URL("Exceptions/ErrorCode.cs", directory), "utf8");
    const errors = new Map([...definitions.matchAll(/public static readonly ErrorCode\s+(\w+)\s*=\s*new\(\s*(\d+)\s*,\s*"([^"]+)"/g)]
        .map(([, name, code, message]) => [name, { code: Number(code), message }]));
    const services = ["MedicalRecordService", "MedicalHistoryService", "PrescriptionService", "PrescriptionService.StockReviews",
        "DispensingService", "MedicineService", "MedicineCategoryService", "SupplierService", "InventoryService", "PurchaseOrderService", "DiseaseService"];
    const referenced = new Set(services.flatMap(service => [...readFileSync(new URL(`Services/Implementations/${service}.cs`, directory), "utf8")
        .matchAll(/ErrorCode\.(\w+)/g)].map(match => match[1])));
    assert.ok(referenced.size > 40, "Read the owned backend error contracts before checking coverage");
    for (const name of referenced) {
        const definition = errors.get(name);
        assert.ok(definition, `Missing error definition: ${name}`);
        const translated = getApiErrorMessage(apiError(definition.code, definition.message));
        assert.notEqual(translated, definition.message, `${name} (${definition.code}) must not expose the English API message`);
        assert.match(translated, /[^\x00-\x7F]/, `${name} has a Vietnamese display message`);
    }
});

test("clinical validation and connection errors do not expose framework or Axios English", () => {
    assert.equal(getApiErrorMessage({ response: { status: 400, data: { title: "One or more validation errors occurred.",
        errors: { Temperature: ["The JSON value could not be converted to System.Decimal."] } } } }),
    "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.");
    assert.equal(getApiErrorMessage({ message: "Network Error" }), "Không thể kết nối tới máy chủ.");
    assert.equal(getApiErrorMessage(apiError(7105, "Paper book update confirmation is required before completing the examination")),
        "Cần xác nhận đã ghi sổ giấy trước khi hoàn tất khám.");
});

test("translation preserves existing custom Vietnamese messages and unrelated fallback behavior", () => {
    const batchMessage = "Số lô DEMO đã có hạn dùng khác. Vui lòng đối chiếu lại.";
    assert.equal(getApiErrorMessage(apiError(6016, batchMessage)), batchMessage);
    assert.equal(getApiErrorMessage(apiError(123456, "Unrelated module detail")), "Unrelated module detail");
    assert.equal(getApiErrorMessage(apiError(7107, "Medical record changed concurrently")),
        "Hồ sơ hoặc đơn thuốc đã thay đổi ở phiên khác. Vui lòng tải lại hồ sơ và đối chiếu sổ giấy trước khi lưu hoặc chốt lượt.");
});
