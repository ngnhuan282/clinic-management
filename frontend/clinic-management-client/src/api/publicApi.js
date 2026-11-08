import axiosClient from "./axiosClient";

export async function getPublicServices() {
    const { data } = await axiosClient.get("/public/services");
    return data.result;
}

export async function getPublicDoctor(doctorId) {
    const { data } = await axiosClient.get(`/doctors/public/${doctorId}`);
    return data.result;
}

export async function createGuestAppointment(payload) {
    const { data } = await axiosClient.post("/appointments/guest", payload);
    return data.result;
}
