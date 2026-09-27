import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath, canSeePage, homeForRole, INTERNAL_PAGES } from "../src/routes/roleAccess.js";

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
