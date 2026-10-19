import axiosClient from "./axiosClient";

/**
 * @typedef {Object} DepartmentSchedule
 * @property {string} scheduleId
 * @property {number} doctorId
 * @property {string} doctorName
 * @property {number} roomId
 * @property {string} roomName
 * @property {string} workDate ISO calendar date
 * @property {string} startTime HH:mm:ss
 * @property {string} endTime HH:mm:ss
 * @property {number} shift 0 morning, 1 afternoon, 2 evening
 * @property {number} maxPatients
 * @property {number} bookedPatients
 * @property {string|null} reviewerName
 * @property {string|null} reviewedAt
 */

const unwrap = (response) => response.data.result ?? response.data;

const doctorScheduleApi = {
    list: (params) => axiosClient.get("/doctor-schedules", { params }),
    department: (params, signal) => axiosClient.get("/doctor-schedules/department", { params, signal }),
    departmentOptions: (signal) => axiosClient.get("/doctor-schedules/department/options", { signal }),
    create: (payload) => axiosClient.post("/doctor-schedules", payload),
    availableSlots: (params) => axiosClient.get("/doctor-schedules/available-slots", { params }),
    submitRequest: (payload) => axiosClient.post("/doctor-schedules/request", payload),
    myRequests: (signal) => axiosClient.get("/doctor-schedules/my-requests", { signal }),
    rooms: (signal) => axiosClient.get("/doctor-schedules/rooms", { signal }),
    doctors: (departmentId) => axiosClient.get("/doctors", { params: { departmentId } }),
    unwrap,
};

export default doctorScheduleApi;
