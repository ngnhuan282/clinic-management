import axiosClient from "./axiosClient";

/**
 * @typedef {Object} PublicRoom
 * @property {number} roomId
 * @property {string} roomCode
 * @property {string} roomName
 * @property {number} departmentId
 * @property {string} departmentName
 */

export async function getPublicRooms() {
    const response = await axiosClient.get("/rooms/public");
    return response.data.result;
}
