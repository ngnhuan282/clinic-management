import axiosClient from "./axiosClient";

export const login = async (payload, signal) => (await axiosClient.post("/auth/login", payload, { signal })).data.result;
export const register = async (payload, signal) => (await axiosClient.post("/auth/register", payload, { signal })).data.result;
