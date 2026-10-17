import test from "node:test";
import assert from "node:assert/strict";
import { getInventoryExpiryText, getInventoryStatuses } from "../src/components/internal/medicines/inventoryStatus.js";

test("lot stock and expiry warnings can appear together", () => {
    assert.deepEqual(getInventoryStatuses({ stockLevel: "LowStock", expiryStatus: "ExpiringSoon" }), ["ExpiringSoon", "LowStock"]);
    assert.deepEqual(getInventoryStatuses({ stockLevel: "LowStock", expiryStatus: "Expired" }), ["Expired", "LowStock"]);
    assert.deepEqual(getInventoryStatuses({ stockLevel: "OutOfStock", expiryStatus: "Expired" }), ["Expired", "OutOfStock"]);
    assert.deepEqual(getInventoryStatuses({ stockLevel: "InStock", expiryStatus: "Expired" }), ["Expired"]);
    assert.deepEqual(getInventoryStatuses({ stockLevel: "InStock", expiryStatus: "Valid" }), ["InStock"]);
});

test("fallback keeps stock and expiry boundaries consistent during an API rollout", () => {
    assert.deepEqual(getInventoryStatuses({ quantityInStock: 0, daysUntilExpiry: -1 }), ["Expired", "OutOfStock"]);
    assert.deepEqual(getInventoryStatuses({ quantityInStock: 10, daysUntilExpiry: 30 }), ["ExpiringSoon", "LowStock"]);
    assert.deepEqual(getInventoryStatuses({ quantityInStock: 11, daysUntilExpiry: 31 }), ["InStock"]);
});

test("expiry text is based on the date, even when the lot is empty or low", () => {
    assert.equal(getInventoryExpiryText({ stockStatus: "OutOfStock", daysUntilExpiry: -5 }), "Quá hạn 5 ngày");
    assert.equal(getInventoryExpiryText({ stockStatus: "LowStock", daysUntilExpiry: 0 }), "Hết hạn hôm nay");
    assert.equal(getInventoryExpiryText({ daysUntilExpiry: 30 }), "Còn 30 ngày");
});
