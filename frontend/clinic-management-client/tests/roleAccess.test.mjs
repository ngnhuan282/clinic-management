import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath, canSeePage, homeForRole, INTERNAL_PAGES, redirectForProtectedRoute } from "../src/routes/roleAccess.js";

test("doctor stock review queue and detail require clinical role and prescribing permission", () => {
    for (const role of ["Doctor", "DepartmentHead"])
        assert.equal(canAccessPath({ role, permissions: ["pharmacy.prescribe"] }, "/internal/doctor/stock-reviews/1"), true);
    for (const role of ["Admin", "Receptionist", "Pharmacist", "Patient"])
        assert.equal(canAccessPath({ role, permissions: ["pharmacy.prescribe"] }, "/internal/doctor/stock-reviews/1"), false);
    assert.equal(canAccessPath({ role: "Doctor", permissions: [] }, "/internal/doctor/stock-reviews"), false);
});

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

test("dispensing detail inherits dispense permission without exposing it to patients or receptionists", () => {
    const path = "/internal/pharmacy/dispensing/1006";
    assert.equal(canAccessPath({ role: "Pharmacist", permissions: ["pharmacy.dispense"] }, path), true);
    assert.equal(canAccessPath({ role: "Admin", permissions: ["pharmacy.dispense"] }, path), true);
    assert.equal(canAccessPath({ role: "Receptionist", permissions: ["billing.create"] }, path), false);
    assert.equal(canAccessPath({ role: "Patient", permissions: [] }, path), false);
    assert.equal(redirectForProtectedRoute({ role: "Receptionist", permissions: ["billing.create"], isAuthenticated: true }, path,
        { allowedPermissions: ["pharmacy.dispense"] }), "/403");
});

test("pharmacist can read stock without gaining catalog or receipt management", () => {
    const pharmacist = { role: "Pharmacist", permissions: ["pharmacy.viewInventory", "pharmacy.viewCatalog", "pharmacy.dispense"] };
    const path = "/internal/pharmacy/inventory";
    const options = { allowedRoles: ["Pharmacist"], allowedPermissions: ["pharmacy.viewInventory"] };
    assert.equal(canAccessPath(pharmacist, path), true);
    assert.equal(redirectForProtectedRoute({ ...pharmacist, isAuthenticated: true }, path, options), null);
    assert.equal(canAccessPath(pharmacist, "/internal/medicines/purchase-orders"), false);
    assert.equal(canAccessPath(pharmacist, "/internal/medicines/categories"), false);
    assert.equal(canAccessPath({ role: "Doctor", permissions: ["pharmacy.viewInventory"] }, path), false);
    assert.equal(canAccessPath({ role: "Patient", permissions: ["pharmacy.viewInventory"] }, path), false);
    assert.equal(canAccessPath({ role: "Pharmacist", permissions: [] }, path), false);
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, path, options), "/internal/login");
    assert.equal(redirectForProtectedRoute({ role: "Doctor", permissions: ["pharmacy.viewInventory"], isAuthenticated: true }, path, options), "/403");
    assert.equal(canAccessPath({ role: "Admin", permissions: ["pharmacy.manageInventory"] }, "/internal/medicines/inventory"), true);
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

test("medical history is a patient-only portal route", () => {
    const path = "/medical-records";
    const options = { allowedRoles: ["Patient"] };
    assert.equal(canAccessPath({ role: "Patient" }, path), true);
    assert.equal(canAccessPath({ role: "Doctor" }, path), false);
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, path, options), "/login");
    assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role: "Doctor" }, path, options), "/403");
    assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role: "Patient" }, path, options), null);
});

test("medical history detail URLs keep the patient-only guard", () => {
    const path = "/medical-records/1023";
    const options = { allowedRoles: ["Patient"] };
    assert.equal(canAccessPath({ role: "Patient" }, path), true);
    assert.equal(canAccessPath({ role: "Doctor" }, path), false);
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, path, options), "/login");
    assert.equal(redirectForProtectedRoute({ isAuthenticated: true, role: "Doctor" }, path, options), "/403");
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
