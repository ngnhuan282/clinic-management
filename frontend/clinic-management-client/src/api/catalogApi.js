import axiosClient from "./axiosClient";

const catalogApi = {
    list: (resource, params) => axiosClient.get(`/${resource}`, { params }),
    create: (resource, data) => axiosClient.post(`/${resource}`, data),
    update: (resource, id, data) => axiosClient.put(`/${resource}/${id}`, data),
    updateStatus: (resource, id, isActive) =>
        axiosClient.patch(`/${resource}/${id}/status`, isActive),
};

export default catalogApi;
