import axiosClient from "./axiosClient";

export async function getPrescriptionById(prescriptionId) {
    const response = await axiosClient.get(
        `/prescriptions/${prescriptionId}`
    );

    return response.data.result;
}

export async function getPrescriptionByMedicalRecord(medicalRecordId) {
    const response = await axiosClient.get(
        `/prescriptions/by-medical-record/${medicalRecordId}`
    );

    return response.data.result;
}

export async function getPrescriptionMedicineOptions() {
    const response = await axiosClient.get(
        "/prescriptions/medicine-options"
    );

    return response.data.result;
}

/** Reissuing a billed order returns code 7407/409; writes may return version conflict 7107/409. */
export async function createPrescription(payload) {
    const response = await axiosClient.post(
        "/prescriptions",
        payload
    );

    return response.data.result;
}

/** Retained medicines keep detail IDs. Active invoices block medicine/quantity changes (7407/409). */
export async function updatePrescription(prescriptionId, payload) {
    const response = await axiosClient.put(
        `/prescriptions/${prescriptionId}`,
        payload
    );

    return response.data.result;
}

/** Active medicine/final invoices must be resolved before cancellation (7407/409). */
export async function cancelPrescription(prescriptionId) {
    const response = await axiosClient.patch(
        `/prescriptions/${prescriptionId}/cancel`
    );

    return response.data.result;
}
