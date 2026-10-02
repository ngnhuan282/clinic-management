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

export async function createPrescription(payload) {
    const response = await axiosClient.post(
        "/prescriptions",
        payload
    );

    return response.data.result;
}

export async function updatePrescription(prescriptionId, payload) {
    const response = await axiosClient.put(
        `/prescriptions/${prescriptionId}`,
        payload
    );

    return response.data.result;
}

export async function cancelPrescription(prescriptionId) {
    const response = await axiosClient.patch(
        `/prescriptions/${prescriptionId}/cancel`
    );

    return response.data.result;
}
