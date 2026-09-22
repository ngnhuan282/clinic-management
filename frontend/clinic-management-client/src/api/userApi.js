import axiosClient from "./axiosClient";

export const getUsers = async (params, signal) => (await axiosClient.get("/users", { params, signal })).data.result;
export const getRoles = async signal => (await axiosClient.get("/roles", { signal })).data.result;
export const updateUserRole = async (id, roleId) => (await axiosClient.patch(`/users/${id}/role`, { roleId })).data.result;
export const updateUserStatus = async (id, status) => (await axiosClient.patch(`/users/${id}/status`, { status })).data.result;
