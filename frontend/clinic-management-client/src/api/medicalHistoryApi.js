import axiosClient from "./axiosClient";

export async function getMedicalHistorySummary(appointmentId, signal) {
    const response = await axiosClient.get(
        `/medical-records/by-appointment/${appointmentId}/history/summary`,
        { signal }
    );
    return response.data.result;
}

export async function getMedicalHistory(appointmentId, params, signal) {
    const response = await axiosClient.get(
        `/medical-records/by-appointment/${appointmentId}/history`,
        { params, signal }
    );
    return response.data.result;
}

export async function getMedicalHistoryDetail(appointmentId, medicalRecordId) {
    const response = await axiosClient.get(
        `/medical-records/by-appointment/${appointmentId}/history/${medicalRecordId}`
    );
    return response.data.result;
}

/** Patient identity and counts for the authenticated account, independent of list filters. */
export async function getMyMedicalHistorySummary(signal) {
    const response = await axiosClient.get("/medical-records/me/history/summary", { signal });
    return response.data.result;
}

/** Completed visits only. Uses the same search, date and pagination parameters as doctor history. */
export async function getMyMedicalHistory(params, signal) {
    const response = await axiosClient.get("/medical-records/me/history", { params, signal });
    return response.data.result;
}

/** Own completed record, prescription and invoice snapshots; another patient's record returns 404. */
export async function getMyMedicalHistoryDetail(medicalRecordId, signal) {
    const response = await axiosClient.get(`/medical-records/me/history/${medicalRecordId}`, { signal });
    return response.data.result;
}
