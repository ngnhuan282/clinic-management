// src/services/signalrService.js

import {
    HubConnectionBuilder,
    LogLevel,
} from "@microsoft/signalr";

let connection = null;

export async function startSignalR() {
    const token =
        localStorage.getItem("accessToken");

    if (connection) {
        return connection;
    }

    connection = new HubConnectionBuilder()
        .withUrl(
            import.meta.env.VITE_SIGNALR_URL ||
                "https://localhost:7001/notificationHub",
            {
                accessTokenFactory: () =>
                    token || "",
            }
        )
        .withAutomaticReconnect()
        .configureLogging(
            LogLevel.Information
        )
        .build();

    try {
        await connection.start();

        return connection;
    } catch (error) {
        connection = null;
        throw error;
    }
}

export async function stopSignalR() {
    if (!connection) {
        return;
    }

    await connection.stop();
    connection = null;
}

export function getSignalRConnection() {
    return connection;
}

export default {
    startSignalR,
    stopSignalR,
    getSignalRConnection,
};