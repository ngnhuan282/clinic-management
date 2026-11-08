import axiosClient from "./axiosClient";

export async function getMyAppointments(params, signal) {
    const response = await axiosClient.get("/appointments/mine", { params, signal });
    return response.data.result;
}

export async function cancelMyAppointment(appointmentId) {
    const response = await axiosClient.patch(`/appointments/mine/${appointmentId}/cancel`);
    return response.data.result;
}
