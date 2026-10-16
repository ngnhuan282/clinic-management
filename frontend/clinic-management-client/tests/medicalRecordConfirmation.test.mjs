import assert from "node:assert/strict";
import test from "node:test";
import {
    getMedicalRecordContentKey, normalizePayloadDiagnoses,
    restoreMedicalRecordDraft, updateMedicalRecordForm,
} from "../src/utils/medicalRecordConfirmation.js";

const form = {
    symptoms: "Symptoms", conclusion: "Conclusion", paperBookConfirmed: true,
    paperBookConfirmationPending: false,
    diagnoses: [
        { localId: "first", diseaseId: 1, isPrimary: true, note: "Primary note" },
        { localId: "second", diseaseId: 2, isPrimary: false, note: "" },
    ],
};

test("confirmation becomes pending immediately without a save", () => {
    const confirmed = updateMedicalRecordForm({ ...form, paperBookConfirmed: false }, { paperBookConfirmed: true });
    assert.equal(confirmed.paperBookConfirmed, true);
    assert.equal(confirmed.paperBookConfirmationPending, true);
});

test("clinical changes invalidate pending and saved confirmation", () => {
    for (const pending of [true, false]) {
        for (const changes of [
            { symptoms: "New symptoms" }, { conclusion: "New conclusion" },
            { diagnoses: form.diagnoses.slice(1) },
            { diagnoses: form.diagnoses.map((item) => ({ ...item, note: "Changed note" })) },
            { diagnoses: form.diagnoses.map((item) => ({ ...item, isPrimary: !item.isPrimary })) },
        ]) {
            const changed = updateMedicalRecordForm({ ...form, paperBookConfirmationPending: pending }, changes);
            assert.equal(changed.paperBookConfirmed, false);
            assert.equal(changed.paperBookConfirmationPending, false);
        }
    }
    assert.equal(form.diagnoses[0].note, "Primary note");
});

test("unchanged values, whitespace, empty rows and reordered diagnoses preserve confirmation", () => {
    for (const changes of [
        { symptoms: " Symptoms " }, { conclusion: "Conclusion" },
        { diagnoses: [...form.diagnoses, { diseaseId: "", isPrimary: false }] },
        { diagnoses: [...form.diagnoses].reverse() },
        { diagnoses: form.diagnoses.map((item) => ({ ...item, note: ` ${item.note} ` })) },
    ]) assert.equal(updateMedicalRecordForm(form, changes).paperBookConfirmed, true);
});

test("normalization selects a primary diagnosis without mutating form rows", () => {
    const rows = [{ diseaseId: "1", isPrimary: false, note: " Note " }];
    assert.deepEqual(normalizePayloadDiagnoses(rows), [{ diseaseId: 1, isPrimary: true, note: "Note" }]);
    assert.equal(rows[0].isPrimary, false);
});

const record = { ...form, patientBookId: 10, updatedAt: "version-one" };
const draft = {
    form: { ...form, symptoms: "Unsaved symptoms", paperBookConfirmationPending: true },
    updatedAt: record.updatedAt, patientBookId: record.patientBookId,
    recordContentKey: getMedicalRecordContentKey(record),
};

test("history and unchanged prescription return preserve the pending draft", () => {
    assert.deepEqual(restoreMedicalRecordDraft(draft, record), draft.form);
});

test("prescription revision preserves clinical draft but requires new confirmation", () => {
    const restored = restoreMedicalRecordDraft(draft, { ...record, updatedAt: "version-two" });
    assert.equal(restored.symptoms, "Unsaved symptoms");
    assert.equal(restored.paperBookConfirmed, false);
    assert.equal(restored.paperBookConfirmationPending, false);
});

test("concurrent clinical or book changes cannot be overwritten by an old draft", () => {
    assert.equal(restoreMedicalRecordDraft(draft, { ...record, symptoms: "Other edit", updatedAt: "version-two" }), null);
    assert.equal(restoreMedicalRecordDraft(draft, { ...record, patientBookId: 11, updatedAt: "version-two" }), null);
});
