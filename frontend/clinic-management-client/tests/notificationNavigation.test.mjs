import test from "node:test";
import assert from "node:assert/strict";
import { notificationDestination, positiveId } from "../src/utils/notificationNavigation.js";
import { homeForRole } from "../src/routes/roleAccess.js";

test("notification result IDs must be valid positive database identifiers", () => {
    for (const value of [null, "", "bad", -1, 1.5, Infinity, 2147483648]) assert.equal(positiveId(value), null);
    assert.equal(positiveId("42"), 42);
});
test("result notifications open the correct portal for Patient, Doctor and DepartmentHead", () => {
    const item = { type: "LabResult", labTestId: 42 };
    assert.equal(notificationDestination(item, { role: "Patient", permissions: ["labs.viewOrders", "labs.viewOwnResult"] }), "/lab-results?labTestId=42");
    for (const role of ["Doctor", "DepartmentHead"])
        assert.equal(notificationDestination(item, { role, permissions: ["labs.viewOrders", "labs.order"] }), "/internal/doctor/lab-orders?labTestId=42");
});
test("result navigation requires both the recipient role and current read permissions", () => {
    for (const user of [{ role: "Patient", permissions: [] }, { role: "Doctor", permissions: ["labs.order"] },
        { role: "Cashier", permissions: ["labs.viewOrders", "labs.order"] }])
        assert.equal(notificationDestination({ type: "LabResult", labTestId: 42 }, user), null);
});
test("stock review notification destinations stay intact", () => {
    assert.equal(notificationDestination({ stockReviewId: 12 }, { role: "Doctor", permissions: ["pharmacy.prescribe"] }), "/internal/doctor/stock-reviews/12");
});
test("Cashier starts at billing only when its view permission is present", () => {
    assert.equal(homeForRole({ role: "Cashier", permissions: ["billing.view"] }), "/internal/cashier/billing");
    assert.equal(homeForRole({ role: "Cashier", permissions: [] }), "/internal/profile");
});
