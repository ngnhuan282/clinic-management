import axiosClient from "./axiosClient";

/**
 * @typedef {Object} PublicDoctorRoom
 * @property {number} roomId
 * @property {string} roomCode
 * @property {string} roomName
 */

/**
 * @typedef {Object} PublicDoctor
 * @property {number} doctorId
 * @property {string} fullName
 * @property {string} title
 * @property {number} experienceYears
 * @property {number} departmentId
 * @property {string} departmentName
 * @property {string | null} biography
 * @property {PublicDoctorRoom[]} rooms
 */

/**
 * @typedef {Object} DoctorProfile
 * @property {number} doctorId
 * @property {string} fullName
 * @property {string} title
 * @property {number} experienceYears
 * @property {string | null} biography
 * @property {number} departmentId
 * @property {string} departmentName
 * @property {string} specializationName
 */

export async function searchPublicDoctors(params) {
    const response = await axiosClient.get("/doctors/public", { params });
    return response.data.result;
}

export async function getMyDoctorProfile() {
    const response = await axiosClient.get("/doctors/me");
    return response.data.result;
}

export async function updateMyDoctorProfile(payload) {
    const response = await axiosClient.put("/doctors/me", payload);
    return response.data.result;
}
