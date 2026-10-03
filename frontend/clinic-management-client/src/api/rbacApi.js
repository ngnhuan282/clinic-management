import axiosClient from "./axiosClient";

const result = response => response.data.result;

export const rbacApi = {
    permissions: async () => result(await axiosClient.get("/rbac/permissions")),
    roles: async params => result(await axiosClient.get("/rbac/roles", { params })),
    role: async id => result(await axiosClient.get(`/rbac/roles/${id}`)),
    create: async data => result(await axiosClient.post("/rbac/roles", data)),
    update: async (id, data) => result(await axiosClient.put(`/rbac/roles/${id}`, data)),
    updatePermissions: async (id, data) => result(await axiosClient.put(`/rbac/roles/${id}/permissions`, data)),
    remove: async (id, version) => axiosClient.delete(`/rbac/roles/${id}`, { data: { version } }),
    audit: async params => result(await axiosClient.get("/rbac/audit", { params })),
};
