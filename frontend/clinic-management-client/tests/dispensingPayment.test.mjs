import test from "node:test";
import assert from "node:assert/strict";
import { getDispensingPaymentLabel } from "../src/components/internal/pharmacy/dispensingStatus.js";

test("dispensing distinguishes partial payment without labeling it paid", () => {
    assert.equal(getDispensingPaymentLabel("Paid"), "Đã thanh toán");
    assert.equal(getDispensingPaymentLabel("PartiallyPaid"), "Thanh toán một phần");
    assert.equal(getDispensingPaymentLabel("Unpaid"), "Chưa thanh toán");
});

test("missing or unsupported payment state never implies payment", () => {
    for (const status of [null, undefined, "", "Cancelled", "Adjustment"])
        assert.equal(getDispensingPaymentLabel(status), "Chưa thanh toán");
});
