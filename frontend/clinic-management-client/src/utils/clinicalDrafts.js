let activeSession;
const drafts = new Map();

// In-memory only: never persist clinical content to browser storage.
export function readClinicalDraft(session, key) {
    if (activeSession !== session) {
        drafts.clear();
        activeSession = session;
    }
    return drafts.get(key) || null;
}

export function writeClinicalDraft(session, key, value) {
    if (session !== activeSession) return;
    if (!drafts.has(key) && drafts.size >= 20) drafts.delete(drafts.keys().next().value);
    drafts.set(key, value);
}

export function clearClinicalDraft(session, key) {
    if (session === activeSession) drafts.delete(key);
}

export function getPrescriptionFormKey(form = {}) {
    return JSON.stringify({
        notes: form.notes?.trim() || "",
        details: (form.details || []).map(item => ({ medicineId: Number(item.medicineId),
            quantity: Number(item.quantity), dosage: item.dosage?.trim() || "", instructions: item.instructions?.trim() || "" }))
            .sort((a, b) => a.medicineId - b.medicineId),
    });
}
