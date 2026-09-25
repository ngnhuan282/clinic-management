import axiosClient from "./axiosClient";

export async function getExaminationQueue(params) {
    const response = await axiosClient.get(
        "/medical-records/queue",
        { params }
    );

    return response.data.result;
}

export async function getMedicalRecordByAppointment(appointmentId) {
    const response = await axiosClient.get(
        `/medical-records/by-appointment/${appointmentId}`
    );

    return response.data.result;
}

export async function startExamination(appointmentId) {
    const response = await axiosClient.patch(
        `/appointments/${appointmentId}/start-examination`
    );

    return response.data.result;
}

export async function createMedicalRecord(payload) {
    const response = await axiosClient.post(
        "/medical-records",
        payload
    );

    return response.data.result;
}

export async function updateMedicalRecord(medicalRecordId, payload) {
    const response = await axiosClient.put(
        `/medical-records/${medicalRecordId}`,
        payload
    );

    return response.data.result;
}
