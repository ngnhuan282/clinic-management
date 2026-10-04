import test from "node:test";
import assert from "node:assert/strict";
import { addDays, mondayOf } from "../src/utils/scheduleCalendar.js";
import { canAccessPath, redirectForProtectedRoute } from "../src/routes/roleAccess.js";

test("calendar navigation preserves dates across month/year boundaries and uses Monday", () => {
    assert.equal(mondayOf("2026-10-04"), "2026-09-28");
    assert.equal(mondayOf("2026-10-05"), "2026-10-05");
    assert.equal(addDays("2026-12-28", 7), "2027-01-04");
    assert.equal(addDays("2026-10-01", -1), "2026-09-30");
});

test("department calendar direct route is restricted to DepartmentHead", () => {
    const path = "/internal/department-schedules";
    assert.equal(canAccessPath({ role: "DepartmentHead", permissions: [] }, path), true);
    for (const role of ["Doctor", "Receptionist", "Patient", "Admin"]) {
        assert.equal(canAccessPath({ role, permissions: ["schedules.review"] }, path), false);
        assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role }, path, { allowedRoles: ["DepartmentHead"] }), "/403");
    }
});
