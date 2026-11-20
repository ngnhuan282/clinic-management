import axiosClient from "./axiosClient";

export async function getAdminStaff(params, signal) {
    const response = await axiosClient.get("/staff", { params, signal });
    return response.data.result;
}

export async function createStaff(payload) {
    const response = await axiosClient.post("/staff", payload);
    return response.data.result;
}

export async function updateStaff(staffId, payload) {
    const response = await axiosClient.put(`/staff/${staffId}`, payload);
    return response.data.result;
}

export async function updateStaffStatus(staffId, isActive) {
    const response = await axiosClient.patch(`/staff/${staffId}/status`, isActive);
    return response.data.result;
}

export async function getLinkableStaffUsers() {
    const response = await axiosClient.get("/staff/linkable-users");
    return response.data.result;
}

export async function linkStaffAccount(staffId, userId) {
    const response = await axiosClient.patch(`/staff/${staffId}/account`, { userId });
    return response.data.result;
}
