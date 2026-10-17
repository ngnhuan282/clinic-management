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

test("pharmacy inventory permission exposes purchase order flows", () => {
    const pharmacist = {
        role: "Pharmacist",
        permissions: ["pharmacy.manageInventory"],
    };

    assert.equal(
        canAccessPath(pharmacist, "/internal/medicines/purchase-orders"),
        true
    );
    assert.equal(
        canAccessPath(pharmacist, "/internal/medicines/inventory"),
        true
    );
    assert.equal(
        canAccessPath(
            { role: "Doctor", permissions: ["pharmacy.viewInventory"] },
            "/internal/medicines"
        ),
        false
    );
});

test("pharmacist opens the dispensing counter with dispense permission", () => {
    const pharmacist = {
        role: "Pharmacist",
        permissions: ["pharmacy.viewInventory", "pharmacy.dispense"],
    };

    assert.equal(homeForRole(pharmacist), "/internal/pharmacy/dispensing");
    assert.equal(
        canAccessPath(pharmacist, "/internal/pharmacy/dispensing"),
        true
    );
    assert.equal(
        canAccessPath(pharmacist, "/internal/medicines/purchase-orders"),
        false
    );
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
    const head = { role: "DepartmentHead", permissions: ["schedules.review", "clinical.viewAssigned", "clinical.manageDiseases", "labs.order"] };
    assert.equal(canAccessPath(head, "/internal/schedule-requests"), true);
    assert.equal(canAccessPath(head, "/internal/examinations/12"), true);
    assert.equal(canAccessPath(head, "/internal/diseases"), true);
    assert.equal(canAccessPath(head, "/internal/doctor/lab-orders"), true);
    assert.equal(canAccessPath(head, "/internal/users"), false);
    assert.equal(homeForRole(head), "/internal/dashboard");
});

test("disease catalog management is hidden from regular doctors", () => {
    const diseasePage = INTERNAL_PAGES.find(item => item.path === "/internal/diseases");
    assert.equal(canSeePage({ role: "Admin", permissions: ["clinical.manageDiseases"] }, diseasePage), true);
    assert.equal(canSeePage({ role: "DepartmentHead", permissions: ["clinical.manageDiseases"] }, diseasePage), true);
    assert.equal(canSeePage({ role: "Doctor", permissions: ["clinical.viewAssigned", "clinical.editDiagnosis"] }, diseasePage), false);
    assert.equal(canSeePage({ role: "Doctor", permissions: ["clinical.manageDiseases"] }, diseasePage), false);
    assert.equal(canAccessPath({ role: "Doctor", permissions: ["clinical.viewAssigned", "clinical.editDiagnosis"] }, "/internal/diseases"), false);
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

test("DepartmentHead, Cashier and Pharmacist can open their account profile but cannot moderate reviews", () => {
    for (const role of ["DepartmentHead", "Cashier", "Pharmacist"]) {
        const user = { role, permissions: [] };
        assert.equal(canAccessPath(user, "/internal/profile"), true);
        assert.equal(canAccessPath(user, "/internal/reviews"), false);
        assert.equal(redirectForProtectedRoute({ ...user, isAuthenticated: true }, "/internal/reviews", { allowedRoles: ["Admin"] }), "/403");
    }
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, "/internal/reviews", { allowedRoles: ["Admin"] }), "/internal/login");
});

test("billing portal is accessible to Cashier and Admin; patient reviews stay in the patient portal", () => {
    assert.equal(canAccessPath({ role: "Cashier", permissions: [] }, "/internal/cashier/billing"), true);
    assert.equal(canAccessPath({ role: "Admin", permissions: [] }, "/internal/cashier/billing"), true);
    assert.equal(canAccessPath({ role: "Pharmacist", permissions: [] }, "/internal/cashier/billing"), false);
    assert.equal(canAccessPath({ role: "Patient", permissions: [] }, "/my-reviews"), true);
    assert.equal(canAccessPath({ role: "Cashier", permissions: [] }, "/my-reviews"), false);
});

test("an authenticated account with an empty custom role still has access to its own profile", () => {
    const user = { isAuthenticated: true, role: "ProfileOnly", permissions: [] };
    assert.equal(canAccessPath(user, "/profile"), true);
    assert.equal(redirectForProtectedRoute(user, "/profile"), null);
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, "/profile"), "/login");
    assert.equal(canAccessPath(user, "/internal/users"), false);
});
