import test from "node:test";
import assert from "node:assert/strict";
import { toPatientProfileForm, toPatientProfilePayload, validatePatientProfileForm } from "../src/utils/patientProfileForm.js";

test("toPatientProfileForm maps a profile response into editable form fields", () => {
    assert.deepEqual(
        toPatientProfileForm({ fullName: "Nguyễn Văn A", phone: "0901234567", birthDate: "1990-05-20T00:00:00", identityNumber: "123456789", insuranceCode: "BH001" }),
        { fullName: "Nguyễn Văn A", phone: "0901234567", birthDate: "1990-05-20", identityNumber: "123456789", insuranceCode: "BH001" }
    );
    assert.deepEqual(
        toPatientProfileForm({ fullName: null, phone: null, birthDate: null, identityNumber: null, insuranceCode: null }),
        { fullName: "", phone: "", birthDate: "", identityNumber: "", insuranceCode: "" }
    );
});

test("toPatientProfilePayload trims text fields and turns blanks into null", () => {
    assert.deepEqual(
        toPatientProfilePayload({ fullName: "  Nguyễn Văn A  ", phone: " 0901234567 ", birthDate: "1990-05-20", identityNumber: " 123 ", insuranceCode: "  " }),
        { fullName: "Nguyễn Văn A", phone: "0901234567", birthDate: "1990-05-20", identityNumber: "123", insuranceCode: null }
    );
    assert.equal(toPatientProfilePayload({ fullName: "A", phone: "B", birthDate: "", identityNumber: "", insuranceCode: "" }).birthDate, null);
});

test("validatePatientProfileForm requires a name and a phone within length limits", () => {
    assert.deepEqual(validatePatientProfileForm({ fullName: "Nguyễn Văn A", phone: "0901234567", identityNumber: "", insuranceCode: "" }), {});
    assert.ok(validatePatientProfileForm({ fullName: "  ", phone: "0901234567", identityNumber: "", insuranceCode: "" }).fullName);
    assert.ok(validatePatientProfileForm({ fullName: "Nguyễn Văn A", phone: " ", identityNumber: "", insuranceCode: "" }).phone);
    assert.ok(validatePatientProfileForm({ fullName: "Nguyễn Văn A", phone: "0901234567", identityNumber: "1".repeat(21), insuranceCode: "" }).identityNumber);
    assert.ok(validatePatientProfileForm({ fullName: "Nguyễn Văn A", phone: "0901234567", identityNumber: "", insuranceCode: "1".repeat(31) }).insuranceCode);
});
