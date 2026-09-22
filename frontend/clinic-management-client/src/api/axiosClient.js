import axios from "axios";
import store from "../store/store";
import { setCredentials, logout } from "../store/authSlice";
import { readSession } from "../utils/authStorage";

let refreshPromise;
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5212/api",
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
});

export function refreshSession() {
    const session = readSession();
    if (!session?.refreshToken) return Promise.reject(new Error("No refresh token"));
    if (refreshPromise?.token === session.refreshToken) return refreshPromise.promise;
    const token = session.refreshToken;
    const promise = axiosClient.post("/auth/refresh", { refreshToken: token })
        .then(async ({ data }) => {
            const { accessToken, refreshToken, ...user } = data.result;
            if (readSession()?.refreshToken !== token) {
                // A late refresh must not restore a session after logout or a different login.
                await axiosClient.post("/auth/logout", { refreshToken }).catch(() => {});
                throw new Error("Session changed");
            }
            store.dispatch(setCredentials({ accessToken, refreshToken, user, remember: session.remember }));
            return accessToken;
        })
        .catch(error => {
            if ([401, 403].includes(error.response?.status) && readSession()?.refreshToken === token)
                store.dispatch(logout());
            throw error;
        })
        .finally(() => { if (refreshPromise?.token === token) refreshPromise = null; });
    refreshPromise = { token, promise };
    return promise;
}

export async function getAccessToken() {
    const session = readSession();
    if (!session) return "";
    try {
        const payload = JSON.parse(atob(session.accessToken.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")));
        if (payload.exp * 1000 > Date.now() + 30000) return session.accessToken;
    } catch { /* Let the server validate or refresh a damaged token. */ }
    return refreshSession();
}

axiosClient.interceptors.request.use(config => {
    const session = readSession();
    config._sessionToken = session?.accessToken;
    config._sessionUserId = session?.user.userId;
    if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
    else delete config.headers.Authorization;
    return config;
});

axiosClient.interceptors.response.use(response => response, async error => {
    const original = error.config;
    const publicAuth = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].includes(original?.url);
    if (error.response?.status !== 401 || publicAuth || !original) throw error;
    const session = readSession();
    if (session?.accessToken !== original._sessionToken) {
        if (session && session.user.userId === original._sessionUserId && !original._retry) {
            original._retry = true;
            return axiosClient(original);
        }
        throw error;
    }
    if (session?.refreshToken && !original._retry) {
        original._retry = true;
        await refreshSession();
        return axiosClient(original);
    }
    if (readSession()?.accessToken === original._sessionToken) store.dispatch(logout());
    throw error;
});

export default axiosClient;
