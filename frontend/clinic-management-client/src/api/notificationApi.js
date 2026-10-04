import axiosClient from "./axiosClient";

/**
 * @typedef {Object} NotificationHistory
 * @property {number} notificationId
 * @property {string} title
 * @property {string} message
 * @property {string} type System, Billing, or Appointment for A5 events
 * @property {boolean} isRead
 * @property {string} createdAt UTC timestamp
 */

export default {
    list: (params) => axiosClient.get("/notifications", { params }),
    markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
};
