export function normalizePayloadDiagnoses(diagnoses = []) {
    const selected = diagnoses.filter((diagnosis) => diagnosis.diseaseId).map((diagnosis) => ({
        diseaseId: Number(diagnosis.diseaseId),
        isPrimary: Boolean(diagnosis.isPrimary),
        note: diagnosis.note?.trim() || null,
    }));

    if (selected.length && !selected.some((diagnosis) => diagnosis.isPrimary)) {
        selected[0].isPrimary = true;
    }

    return selected;
}

export function getMedicalRecordContentKey(record) {
    return JSON.stringify({
        symptoms: record.symptoms?.trim() || "",
        conclusion: record.conclusion?.trim() || "",
        diagnoses: normalizePayloadDiagnoses(record.diagnoses)
            .sort((a, b) => a.diseaseId - b.diseaseId),
    });
}

export function updateMedicalRecordForm(current, changes) {
    const next = { ...current, ...changes };
    if (getMedicalRecordContentKey(current) !== getMedicalRecordContentKey(next)) {
        next.paperBookConfirmed = false;
        next.paperBookConfirmationPending = false;
    } else if (Object.hasOwn(changes, "paperBookConfirmed")) {
        next.paperBookConfirmationPending = Boolean(changes.paperBookConfirmed);
    }
    return next;
}

export function restoreMedicalRecordDraft(draft, record) {
    if (!draft) return null;
    if (draft.updatedAt === record.updatedAt) return draft.form;

    // A prescription change can invalidate confirmation without changing the clinical fields.
    if (draft.patientBookId === record.patientBookId &&
        draft.recordContentKey === getMedicalRecordContentKey(record)) {
        return { ...draft.form, paperBookConfirmed: false, paperBookConfirmationPending: false };
    }
    return null;
}
