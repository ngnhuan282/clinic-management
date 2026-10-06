import axiosClient from "./axiosClient";

/**
 * @typedef {"Pending" | "Issued" | "Lost" | "Replaced"} PatientBookStatus
 */

/**
 * @typedef {Object} PatientBookListItem
 * @property {number} patientBookId
 * @property {number} patientId
 * @property {string} patientName
 * @property {string} patientPhone
 * @property {number | null} bookInvoiceId
 * @property {number | null} previousBookId
 * @property {string} bookNumber
 * @property {PatientBookStatus} status
 * @property {string} issuedAt
 */

/**
 * @typedef {Object} PatientBook
 * @property {number} patientBookId
 * @property {number} patientId
 * @property {number | null} bookInvoiceId
 * @property {number | null} previousBookId
 * @property {string} bookNumber
 * @property {PatientBookStatus} status
 * @property {string} issuedAt
 */

export async function getPatientBooks(params) {
    const response = await axiosClient.get("/PatientBooks", { params });
    return response.data.result;
}

/**
 * @param {number} patientBookId
 * @param {{ status: PatientBookStatus, newBookNumber?: string }} payload
 */
export async function updatePatientBookStatus(patientBookId, payload) {
    const response = await axiosClient.put(`/PatientBooks/${patientBookId}/status`, payload);
    return response.data.result;
}

export async function getPatientBookHistory(patientBookId) {
    const response = await axiosClient.get(`/PatientBooks/${patientBookId}/history`);
    return response.data.result;
}
