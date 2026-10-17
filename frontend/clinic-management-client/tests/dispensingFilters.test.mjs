import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DISPENSING_FILTERS, readDispensingFilters, writeDispensingFilters } from "../src/utils/dispensingFilters.js";

test("dispensing filters round-trip through list and detail URLs", () => {
    const filters = { search: "Demo Patient 07", workflowStatus: "NeedsReview", paymentStatus: "Paid", reviewStatus: "Pending",
        fromDate: "2026-10-01", toDate: "2026-10-12", pageNumber: 3, pageSize: 5 };
    assert.deepEqual(readDispensingFilters(writeDispensingFilters(filters)), filters);
});

test("default filters do not add noise to dispensing URLs", () => {
    assert.equal(writeDispensingFilters(DEFAULT_DISPENSING_FILTERS).toString(), "");
    assert.deepEqual(readDispensingFilters(new URLSearchParams()), DEFAULT_DISPENSING_FILTERS);
});

test("invalid URL values cannot produce unsupported filters or pagination", () => {
    const params = new URLSearchParams({ workflowStatus: "Wrong", paymentStatus: "Wrong", reviewStatus: "Wrong", search: "a".repeat(250),
        fromDate: "2026-02-30", toDate: "0000-01-01", pageNumber: "9007199254740991", pageSize: "100" });
    assert.deepEqual(readDispensingFilters(params), { ...DEFAULT_DISPENSING_FILTERS, search: "a".repeat(200) });
    assert.equal(readDispensingFilters(new URLSearchParams("pageNumber=-2&pageSize=5")).pageNumber, 1);
});

test("review-only filters do not leak into other dispensing tabs", () => {
    const filters = readDispensingFilters(new URLSearchParams("workflowStatus=Ready&paymentStatus=Paid&reviewStatus=Pending&fromDate=2024-02-29"));
    assert.equal(filters.paymentStatus, "");
    assert.equal(filters.reviewStatus, "");
    assert.equal(filters.fromDate, "2024-02-29");
});
