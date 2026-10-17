import axiosClient from "./axiosClient";

export async function getMyAppointments(params, signal) {
    const response = await axiosClient.get("/appointments/mine", { params, signal });
    return response.data.result;
}
