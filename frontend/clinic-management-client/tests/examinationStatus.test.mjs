import test from "node:test";
import assert from "node:assert/strict";
import {
    getExaminationQueueStatus,
    getExaminationStatus,
    normalizeExaminationStatus,
} from "../src/components/internal/examinations/examinationStatus.js";

test("queue distinguishes bookings awaiting confirmation and reception", () => {
    assert.equal(getExaminationQueueStatus({ status: "Pending" }), "pendingConfirmation");
    assert.equal(getExaminationQueueStatus({ status: " pending ", patientBookId: 1, bookVerifiedAt: "2026-10-30T08:00:00" }), "pendingConfirmation");
    assert.equal(getExaminationQueueStatus({ status: "Confirmed" }), "awaitingReception");
    assert.equal(getExaminationQueueStatus({ status: "Confirmed", patientBookId: 1 }), "awaitingReception");
    assert.equal(getExaminationQueueStatus({ status: "Confirmed", bookVerifiedAt: "2026-10-30T08:00:00" }), "awaitingReception");
});

test("only a confirmed visit with its verified book joins the waiting queue", () => {
    assert.equal(getExaminationQueueStatus({ status: "Confirmed", patientBookId: 1, bookVerifiedAt: "2026-10-30T08:00:00" }), "waiting");
    assert.equal(getExaminationQueueStatus({ status: "InProgress" }), "inProgress");
    assert.equal(getExaminationQueueStatus({ status: "Completed" }), "completed");
    assert.equal(getExaminationQueueStatus({ status: "Cancelled" }), "absent");
    assert.equal(getExaminationQueueStatus({ status: "priority" }), "priority");
});

test("queue-only states retain their display labels through normalization", () => {
    for (const [status, label] of [["pendingConfirmation", "Chờ xác nhận"], ["awaitingReception", "Chờ tiếp nhận"], ["waiting", "Đang chờ khám"]]) {
        assert.equal(normalizeExaminationStatus(status), status);
        assert.equal(getExaminationStatus(status).label, label);
    }
});

test("queue presentation does not change the existing form status contract", () => {
    assert.equal(normalizeExaminationStatus("Pending"), "waiting");
    assert.equal(normalizeExaminationStatus("Confirmed"), "waiting");
    const source = { status: "Confirmed", patientBookId: 1, bookVerifiedAt: "2026-10-30T08:00:00" };
    getExaminationQueueStatus(source);
    assert.equal(source.status, "Confirmed");
});
