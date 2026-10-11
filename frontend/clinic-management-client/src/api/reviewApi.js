import axiosClient from "./axiosClient";

export const reviewApi = {
    publicList: async (params, signal) => (await axiosClient.get("/reviews", { params, signal })).data.result,
    adminList: async (params, signal) => (await axiosClient.get("/reviews/admin", { params, signal })).data.result,
    myAppointments: async (params, signal) => (await axiosClient.get("/reviews/my-appointments", { params, signal })).data.result,
    create: async payload => (await axiosClient.post("/reviews", payload)).data.result,
    setVisibility: async (id, isVisible) => (await axiosClient.patch(`/reviews/${id}/visibility`, { isVisible })).data.result,
};
