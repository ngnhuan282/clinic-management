import test from "node:test";
import assert from "node:assert/strict";
import { validateDoctorForm } from "../src/utils/doctorManagement.js";

const values = { fullName: "Nguyễn Văn A", title: "Thạc sĩ", experienceYears: "5", biography: "", departmentId: "1", specializationId: "2" };

test("a complete doctor form passes validation", () => {
    assert.deepEqual(validateDoctorForm(values), {});
});

test("full name and title are required, within length limits", () => {
    assert.ok(validateDoctorForm({ ...values, fullName: "  " }).fullName);
    assert.ok(validateDoctorForm({ ...values, fullName: "a".repeat(101) }).fullName);
    assert.ok(validateDoctorForm({ ...values, title: "" }).title);
    assert.ok(validateDoctorForm({ ...values, title: "a".repeat(51) }).title);
});

test("experience years must be an integer between 0 and 70", () => {
    assert.deepEqual(validateDoctorForm({ ...values, experienceYears: "0" }), {});
    assert.deepEqual(validateDoctorForm({ ...values, experienceYears: "70" }), {});
    assert.ok(validateDoctorForm({ ...values, experienceYears: "" }).experienceYears);
    assert.ok(validateDoctorForm({ ...values, experienceYears: "-1" }).experienceYears);
    assert.ok(validateDoctorForm({ ...values, experienceYears: "71" }).experienceYears);
    assert.ok(validateDoctorForm({ ...values, experienceYears: "2.5" }).experienceYears);
});

test("department and specialization are required", () => {
    assert.ok(validateDoctorForm({ ...values, departmentId: "" }).departmentId);
    assert.ok(validateDoctorForm({ ...values, specializationId: "" }).specializationId);
});

test("biography is optional but capped at 500 characters", () => {
    assert.deepEqual(validateDoctorForm({ ...values, biography: "a".repeat(500) }), {});
    assert.ok(validateDoctorForm({ ...values, biography: "a".repeat(501) }).biography);
});
