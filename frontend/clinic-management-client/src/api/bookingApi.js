import axiosClient from "./axiosClient";

export async function getDepartments() {
    const response = await axiosClient.get(
        "/appointments/departments"
    );

    return response.data.result;
}

export async function getDoctorsByDepartment(departmentId) {
    const response = await axiosClient.get("/doctors", {
        params: { departmentId },
    });

    return response.data.result;
}

export async function getAvailableSlots(doctorId, date) {
    const response = await axiosClient.get(
        "/appointments/available-slots",
        {
            params: {
                doctorId,
                date,
            },
        }
    );

    return response.data.result;
}

export async function createAppointment(payload) {
    const response = await axiosClient.post(
        "/appointments",
        payload
    );

    return response.data.result;
}
