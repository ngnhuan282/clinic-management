import test from "node:test";
import assert from "node:assert/strict";
import { readClinicalDraft, writeClinicalDraft, clearClinicalDraft, getPrescriptionFormKey } from "../src/utils/clinicalDrafts.js";

test("clinical drafts are in-memory, session-bound and explicitly discardable", () => {
    assert.equal(readClinicalDraft("session-a", "record:1"), null);
    writeClinicalDraft("session-a", "record:1", { form: { symptoms: "draft" } });
    assert.equal(readClinicalDraft("session-a", "record:1").form.symptoms, "draft");
    assert.equal(readClinicalDraft("session-b", "record:1"), null);
    writeClinicalDraft("session-a", "record:1", { form: { symptoms: "late writer" } });
    assert.equal(readClinicalDraft("session-b", "record:1"), null);
    writeClinicalDraft("session-b", "record:1", { form: {} });
    clearClinicalDraft("session-b", "record:1");
    assert.equal(readClinicalDraft("session-b", "record:1"), null);
});

test("prescription dirty comparison ignores IDs, order and insignificant whitespace", () => {
    const first = { notes: " advice ", details: [{ medicineId: 1, quantity: "6", dosage: " daily ", instructions: "after meals" }] };
    const saved = { notes: "advice", details: [{ medicineId: 1, quantity: 6, dosage: "daily", instructions: "after meals", prescriptionDetailId: 9 }] };
    assert.equal(getPrescriptionFormKey(first), getPrescriptionFormKey(saved));
    assert.notEqual(getPrescriptionFormKey({ ...first, notes: "changed" }), getPrescriptionFormKey(saved));
    assert.notEqual(getPrescriptionFormKey({ ...first, details: [{ ...first.details[0], quantity: 9 }] }), getPrescriptionFormKey(saved));
});
