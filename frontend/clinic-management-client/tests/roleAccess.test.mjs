import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath, canSeePage, homeForRole, INTERNAL_PAGES, redirectForProtectedRoute } from "../src/routes/roleAccess.js";

test("custom role sees only pages allowed by current permissions", () => {
    const reader = { role: "LabReader", permissions: ["labs.viewTypes"] };
    assert.equal(homeForRole(reader), "/internal/dashboard");
    assert.equal(canAccessPath(reader, "/internal/lab-test-types"), true);
    assert.equal(canAccessPath(reader, "/internal/roles-permissions"), false);
    assert.equal(canAccessPath(reader, "/internal/examinations/1/record"), false);
});

test("RBAC page requires both Admin role and management permission", () => {
    const page = INTERNAL_PAGES.find(item => item.path === "/internal/roles-permissions");
    assert.equal(canSeePage({ role: "Admin", permissions: ["accounts.manageRoles"] }, page), true);
    assert.equal(canSeePage({ role: "Admin", permissions: [] }, page), false);
    assert.equal(canSeePage({ role: "Cashier", permissions: ["accounts.manageRoles"] }, page), false);
});

test("patient remains in patient portal", () => {
    const patient = { role: "Patient", permissions: ["appointments.bookSelf", "labs.viewOwnResult"] };
    assert.equal(homeForRole(patient), "/booking");
    assert.equal(canAccessPath(patient, "/booking"), true);
    assert.equal(canAccessPath(patient, "/internal/dashboard"), false);
});

test("DepartmentHead keeps doctor pages and sees review queue with permission", () => {
    const head = { role: "DepartmentHead", permissions: ["schedules.review", "clinical.viewAssigned", "labs.order"] };
    assert.equal(canAccessPath(head, "/internal/schedule-requests"), true);
    assert.equal(canAccessPath(head, "/internal/examinations/12"), true);
    assert.equal(canAccessPath(head, "/internal/doctor/lab-orders"), true);
    assert.equal(canAccessPath(head, "/internal/users"), false);
    assert.equal(homeForRole(head), "/internal/dashboard");
});

test("review page is absent for Doctor and unrelated custom roles", () => {
    assert.equal(canAccessPath({ role: "Doctor", permissions: ["clinical.viewAssigned"] }, "/internal/schedule-requests"), false);
    assert.equal(canAccessPath({ role: "LabReader", permissions: ["schedules.review"] }, "/internal/schedule-requests"), false);
    assert.equal(canAccessPath({ role: "DepartmentHead", permissions: [] }, "/internal/schedule-requests"), false);
});

test("direct review URL redirects to login or 403 according to the active session", () => {
    const path = "/internal/schedule-requests";
    const options = { allowedRoles: ["Admin", "DepartmentHead"], allowedPermissions: ["schedules.review"] };
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, path, options), "/internal/login");
    assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role: "Doctor", permissions: ["clinical.viewAssigned"] }, path, options), "/403");
    assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role: "DepartmentHead", permissions: ["schedules.review"] }, path, options), null);
});
