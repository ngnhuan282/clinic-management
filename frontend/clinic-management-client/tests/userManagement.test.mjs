import test from "node:test";
import assert from "node:assert/strict";
import { userCsvCell, usersToCsv, validateStaffUser, validateUserProfile } from "../src/utils/userManagement.js";

const values = { username: "staff.test", password: "initial-password", fullName: "Nguyễn Thị An", email: "an@example.test", phone: "0901234567", roleId: "3", doctorId: "" };

test("staff creation validates role and requires an existing doctor profile for clinical roles", () => {
    assert.deepEqual(validateStaffUser(values, "Receptionist"), {});
    assert.ok(validateStaffUser(values, "Doctor").doctorId);
    assert.ok(validateStaffUser(values, "DepartmentHead").doctorId);
    assert.deepEqual(validateStaffUser({ ...values, doctorId: "1" }, "Doctor"), {});
    assert.ok(validateStaffUser(values, "Patient").roleId);
});
test("password length respects the BCrypt UTF-8 byte limit", () => {
    assert.ok(validateStaffUser({ ...values, password: "😀".repeat(19) }, "Receptionist").password);
    assert.ok(validateStaffUser({ ...values, password: "abcd\0efgh" }, "Receptionist").password);
    assert.ok(validateStaffUser({ ...values, password: "        " }, "Receptionist").password);
    assert.equal(validateStaffUser({ ...values, password: "a".repeat(72) }, "Receptionist").password, undefined);
});
test("account profile accepts optional contacts and rejects malformed details", () => {
    assert.deepEqual(validateUserProfile({ fullName: "Nguyễn An", email: "", phone: "" }), {});
    const errors = validateUserProfile({ fullName: "  ", email: "not an email", phone: "phone" });
    assert.ok(errors.fullName && errors.email && errors.phone);
});
test("CSV export quotes embedded commas, quotes and newlines", () => {
    assert.equal(userCsvCell('An, "Bình"\nChi'), '"An, ""Bình""\nChi"');
});
test("CSV export prevents formula interpretation in spreadsheet readers", () => {
    for (const value of ["=1+1", "+84901234567", "-12", "@SUM(A1)", "  =HYPERLINK(x)", "\tformula"])
        assert.ok(userCsvCell(value).startsWith('"\''));
});
test("CSV export uses actual account fields and keeps Vietnamese text", () => {
    const csv = usersToCsv([{ username: "staff", fullName: "Nguyễn An", role: "Receptionist", status: true, email: null, phone: "0901234567" }]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("Nguyễn An") && csv.includes("Lễ tân"));
    assert.ok(!csv.includes("undefined") && !csv.includes("192.168"));
});
