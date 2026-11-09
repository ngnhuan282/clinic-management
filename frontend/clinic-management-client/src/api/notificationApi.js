import axiosClient from "./axiosClient";

/**
 * @typedef {Object} NotificationHistory
 * @property {number} notificationId
 * @property {string} title
 * @property {string} message
 * @property {string} type System, Billing, Appointment, or LabResult
 * @property {number|null} labTestId Result detail identifier when type is LabResult
 * @property {boolean} isRead
 * @property {string} createdAt UTC timestamp
 */

export default {
    list: (params) => axiosClient.get("/notifications", { params }),
    markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
};
