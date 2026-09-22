import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import axiosClient, { getAccessToken } from "../api/axiosClient";
import { readSession } from "../utils/authStorage";

export function connectNotifications(onNotification) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5212/api";
    const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL || apiUrl.replace(/\/api\/?$/, "") + "/hubs/notification";
    const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: getAccessToken })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.None)
        .build();
    let disposed = false;
    let retryTimer;
    const retry = () => {
        if (!disposed && readSession()) retryTimer = setTimeout(start, 10000);
    };
    async function start() {
        if (disposed || !readSession()) return;
        try { await connection.start(); }
        catch { retry(); }
    }
    connection.on("NotificationReceived", notification => { if (!disposed) onNotification(notification); });
    connection.onclose(async () => {
        if (disposed || !readSession()) return;
        try { await axiosClient.get("/auth/me"); }
        catch { /* Invalid credentials are removed by the interceptor; network failures may retry. */ }
        retry();
    });
    void start();
    return () => {
        disposed = true;
        clearTimeout(retryTimer);
        connection.off("NotificationReceived");
        void connection.stop().catch(() => {});
    };
}
