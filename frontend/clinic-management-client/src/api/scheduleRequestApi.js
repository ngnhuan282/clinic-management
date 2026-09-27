import axiosClient from "./axiosClient";

const scheduleRequestApi = {
    list: (params) => axiosClient.get("/schedule-requests", { params }).then(response => response.data.result),
    get: (id) => axiosClient.get(`/schedule-requests/${id}`).then(response => response.data.result),
    approve: (id) => axiosClient.post(`/schedule-requests/${id}/approve`).then(response => response.data.result),
    reject: (id, rejectReason) => axiosClient.post(`/schedule-requests/${id}/reject`, { rejectReason }).then(response => response.data.result),
};

export default scheduleRequestApi;
