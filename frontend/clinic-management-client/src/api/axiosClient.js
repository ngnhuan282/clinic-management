import axios from "axios";
import store from "../store/store";
import { setCredentials, logout } from "../store/authSlice";
import { readSession } from "../utils/authStorage";

let refreshPromise;
let authMutation = Promise.resolve();
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5212/api",
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
    withCredentials: true,
});

export function refreshSession() {
    if (refreshPromise) return refreshPromise;
    const session = readSession();
    if (!session) return Promise.reject(new Error("No active session"));
    const token = session.accessToken;
    refreshPromise = axiosClient.post("/auth/refresh")
        .then(({ data }) => {
            if (readSession()?.accessToken !== token) throw new Error("Session changed");
            const { accessToken, ...user } = data.result;
            store.dispatch(setCredentials({ accessToken, user, remember: session.remember }));
            return accessToken;
        })
        .catch(error => {
            if ([401, 403].includes(error.response?.status) && readSession()?.accessToken === token)
                store.dispatch(logout());
            throw error;
        })
        .finally(() => { refreshPromise = null; });
    return refreshPromise;
}

// Cookie writes finish in order so a refresh in flight cannot replace the logout cookie.
export function mutateAuth(path, payload, config) {
    const pendingRefresh = refreshPromise;
    const operation = authMutation.catch(() => {}).then(async () => {
        await pendingRefresh?.catch(() => {});
        return axiosClient.post(path, payload, config);
    });
    authMutation = operation;
    return operation;
}

export async function logoutSession() {
    store.dispatch(logout());
    await mutateAuth("/auth/logout");
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
    if (session?.accessToken && !["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].includes(config.url))
        config.headers.Authorization = `Bearer ${session.accessToken}`;
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
    if (session && !original._retry) {
        original._retry = true;
        await refreshSession();
        return axiosClient(original);
    }
    if (readSession()?.accessToken === original._sessionToken) store.dispatch(logout());
    throw error;
});

export default axiosClient;
