import test from "node:test";
import assert from "node:assert/strict";
import { clinicToday, validateGuestBooking } from "../src/utils/publicBooking.js";

const valid = { departmentId: "1", doctorId: "2", date: "2026-11-09", startTime: "09:00:00", patientName: "Nguyễn Thị An", patientPhone: "0901234567", reason: "Khám sức khỏe", consent: true };

test("clinic date uses Vietnam timezone across a UTC day boundary", () => {
    assert.equal(clinicToday(new Date("2026-11-08T18:00:00Z")), "2026-11-09");
    assert.equal(clinicToday(new Date("2026-11-08T16:59:59Z")), "2026-11-08");
});

test("a guest can book with a domestic or international Vietnamese phone number", () => {
    assert.deepEqual(validateGuestBooking(valid, "2026-11-09"), {});
    assert.deepEqual(validateGuestBooking({ ...valid, patientPhone: "+84901234567" }, "2026-11-09"), {});
});

test("guest booking requires contact, slot, reason and contact consent", () => {
    const errors = validateGuestBooking({ ...valid, departmentId: "", doctorId: "", startTime: "", patientName: "  ", patientPhone: "123", reason: "  ", consent: false }, "2026-11-09");
    assert.deepEqual(Object.keys(errors).sort(), ["departmentId", "doctorId", "startTime", "patientName", "patientPhone", "reason", "consent"].sort());
});

test("past dates and overlong patient details cannot be submitted", () => {
    const errors = validateGuestBooking({ ...valid, date: "2026-11-08", patientName: "a".repeat(101), reason: "a".repeat(501) }, "2026-11-09");
    assert.ok(errors.date && errors.patientName && errors.reason);
});

test("guest dates must be real calendar days", () => {
    for (const date of ["2026-02-30", "2026-13-01", "2026-11-99", "not-a-date"])
        assert.ok(validateGuestBooking({ ...valid, date }, "2026-01-01").date);
});
