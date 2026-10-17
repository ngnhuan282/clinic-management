import axiosClient, { mutateAuth } from "./axiosClient";

export const login = async (payload, signal) => (await mutateAuth("/auth/login", payload, { signal })).data.result;
export const register = async (payload, signal) => (await mutateAuth("/auth/register", payload, { signal })).data.result;
export const getMyProfile = async () => (await axiosClient.get("/auth/me")).data.result;
export const updateMyProfile = async payload => (await axiosClient.put("/auth/me", payload)).data.result;
