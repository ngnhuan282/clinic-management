import test from "node:test";
import assert from "node:assert/strict";
import { validateStaffForm } from "../src/utils/staffManagement.js";

const values = { fullName: "Nguyễn Văn A", jobPositionId: "1" };

test("a complete staff form passes validation", () => {
    assert.deepEqual(validateStaffForm(values), {});
});

test("full name is required, within length limit", () => {
    assert.ok(validateStaffForm({ ...values, fullName: "  " }).fullName);
    assert.ok(validateStaffForm({ ...values, fullName: "a".repeat(101) }).fullName);
});

test("job position is required", () => {
    assert.ok(validateStaffForm({ ...values, jobPositionId: "" }).jobPositionId);
});
