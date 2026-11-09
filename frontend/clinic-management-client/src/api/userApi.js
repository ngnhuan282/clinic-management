import axiosClient from "./axiosClient";

export const getUsers = async (params, signal) => (await axiosClient.get("/users", { params, signal })).data.result;
export const getUserSummary = async (params, signal) => (await axiosClient.get("/users/summary", { params, signal })).data.result;
export const getAvailableDoctorProfiles = async (params, signal) => (await axiosClient.get("/users/available-doctor-profiles", { params, signal })).data.result;
export const createStaffUser = async payload => (await axiosClient.post("/users", payload)).data.result;
export const updateUserProfile = async (id, payload) => (await axiosClient.put(`/users/${id}`, payload)).data.result;
export const getRoles = async signal => (await axiosClient.get("/roles", { signal })).data.result;
export const updateUserRole = async (id, roleId) => (await axiosClient.patch(`/users/${id}/role`, { roleId })).data.result;
export const updateUserStatus = async (id, status) => (await axiosClient.patch(`/users/${id}/status`, { status })).data.result;
