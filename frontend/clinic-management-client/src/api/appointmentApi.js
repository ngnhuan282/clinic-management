import axiosClient from "./axiosClient";

export async function getAppointments(params, signal) {
    const response = await axiosClient.get("/appointments", {
        params,
        signal,
    });

    return response.data.result;
}

export async function confirmAppointment(id) {
    const response = await axiosClient.patch(
        `/appointments/${id}/confirm`
    );

    return response.data.result;
}

export async function createDirectAppointment(payload) {
    const response = await axiosClient.post(
        "/appointments/direct",
        payload
    );

    return response.data.result;
}

export async function rescheduleAppointment(id, payload) {
    const response = await axiosClient.patch(
        `/appointments/${id}/reschedule`,
        payload
    );

    return response.data.result;
}

export async function cancelAppointment(id) {
    const response = await axiosClient.patch(
        `/appointments/${id}/cancel`
    );

    return response.data.result;
}
