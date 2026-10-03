import axiosClient from "./axiosClient";

const unwrap = (response) => response.data.result ?? response.data;

const doctorScheduleApi = {
    list: (params) => axiosClient.get("/doctor-schedules", { params }),
    create: (payload) => axiosClient.post("/doctor-schedules", payload),
    availableSlots: (params) => axiosClient.get("/doctor-schedules/available-slots", { params }),
    submitRequest: (payload) => axiosClient.post("/doctor-schedules/request", payload),
    myRequests: () => axiosClient.get("/doctor-schedules/my-requests"),
    rooms: () => axiosClient.get("/doctor-schedules/rooms"),
    doctors: (departmentId) => axiosClient.get("/doctors", { params: { departmentId } }),
    unwrap,
};

export default doctorScheduleApi;
