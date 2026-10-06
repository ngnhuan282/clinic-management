import axiosClient from "./axiosClient";

/**
 * @typedef {Object} PatientProfile
 * @property {number} patientId
 * @property {string} fullName
 * @property {string} phone
 * @property {string | null} birthDate
 * @property {string | null} identityNumber
 * @property {string | null} insuranceCode
 * @property {string} createdAt
 */

export async function getMyPatientProfile() {
    const response = await axiosClient.get("/patients/me");
    return response.data.result;
}

export async function updateMyPatientProfile(payload) {
    const response = await axiosClient.put("/patients/me", payload);
    return response.data.result;
}
