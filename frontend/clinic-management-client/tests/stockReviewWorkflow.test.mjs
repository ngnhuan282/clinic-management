import test from "node:test";
import assert from "node:assert/strict";
import { buildStockReviewRecheckRequest, getStockReviewLockedMessage, getStockReviewRecheckResultConfig, getStockReviewStatusConfig,
    getStockReviewWorkflowStatus } from "../src/utils/stockReviewWorkflow.js";

test("open review phases use the latest decision without changing database statuses", () => {
    assert.equal(getStockReviewWorkflowStatus({ status: "Pending", decisions: [] }), "PendingDoctor");
    for (const outcome of ["Kept", "Applied"])
        assert.equal(getStockReviewWorkflowStatus({ status: "Pending", decisions: [{ outcome }] }), "WaitingPharmacyRecheck");
    assert.equal(getStockReviewWorkflowStatus({ status: "Pending", lastOutcome: "AwaitingBilling" }), "WaitingBilling");
    assert.equal(getStockReviewWorkflowStatus({ status: "Pending", decisions: [{ outcome: "AwaitingBilling" }, { outcome: "Kept" }] }), "WaitingBilling");
});

test("terminal outcomes remain distinct even with legacy multiple-decision history", () => {
    const history = [{ outcome: "Kept" }, { outcome: "AwaitingBilling" }];
    assert.equal(getStockReviewWorkflowStatus({ status: "Resolved", decisions: history }), "Completed");
    assert.equal(getStockReviewWorkflowStatus({ status: "StillShortage", decisions: history }), "StillShortage");
    assert.match(getStockReviewStatusConfig({ status: "StillShortage" }).label, /vẫn thiếu/);
    assert.match(getStockReviewLockedMessage({ status: "StillShortage" }), /giữ nguyên trong nhật ký/);
});

test("badge and final recheck result use the same terminal outcome for each round", () => {
    const oldReview = { reviewId: 4, status: "StillShortage", decisions: [{ outcome: "Kept" }] };
    const latestReview = { reviewId: 5, status: "Resolved", decisions: [{ outcome: "Applied" }] };
    const original = structuredClone(oldReview);
    assert.equal(getStockReviewStatusConfig(latestReview).label, "Đã đối chiếu đủ tồn");
    assert.equal(getStockReviewRecheckResultConfig(latestReview).label, "Đủ tồn còn hạn");
    assert.equal(getStockReviewRecheckResultConfig(latestReview).color, getStockReviewStatusConfig(latestReview).color);
    assert.match(getStockReviewStatusConfig(oldReview).label, /vẫn thiếu/);
    assert.equal(getStockReviewRecheckResultConfig(oldReview).label, "Vẫn thiếu thuốc");
    assert.equal(getStockReviewRecheckResultConfig(oldReview).color, getStockReviewStatusConfig(oldReview).color);
    assert.deepEqual(oldReview, original, "A later sufficient round must not rewrite the older shortage result");
});

test("pending doctor, billing and pharmacy phases never fabricate a final recheck result", () => {
    for (const outcome of [undefined, "AwaitingBilling", "Kept", "Applied"])
        assert.equal(getStockReviewRecheckResultConfig({ status: "Pending", decisions: outcome ? [{ outcome }] : [],
            resolvedAt: "2026-10-12T16:19:00Z" }), null);
});

test("recheck targets the active review and exact prescription and review versions", () => {
    const detail = { updatedAt: "2026-10-12T01:00:00Z", reviews: [
        { reviewId: 5, status: "StillShortage", updatedAt: "old" },
        { reviewId: 6, status: "Pending", updatedAt: "2026-10-12T02:00:00Z", decisions: [{ outcome: "Applied" }] },
    ] };
    assert.deepEqual(buildStockReviewRecheckRequest(detail), { expectedReviewId: 6,
        expectedReviewUpdatedAt: "2026-10-12T02:00:00Z", expectedPrescriptionUpdatedAt: detail.updatedAt });
});

test("recheck cannot be prepared before doctor response, during billing, or after closure", () => {
    for (const review of [{ status: "Pending", decisions: [] },
        { status: "Pending", decisions: [{ outcome: "AwaitingBilling" }] }, { status: "Resolved" }, { status: "StillShortage" }])
        assert.equal(buildStockReviewRecheckRequest({ reviews: [review] }), null);
    assert.equal(buildStockReviewRecheckRequest({}), null);
});
