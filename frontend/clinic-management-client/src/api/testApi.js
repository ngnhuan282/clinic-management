import axiosClient from "./axiosClient";

export const pingBackend = async () => {
    const response = await axiosClient.get("/Test/ping");

    return response.data;
};