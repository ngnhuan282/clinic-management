import axios from "axios";
import store from "../store/store";
import { setCredentials, logout } from "../store/authSlice";
import { readSession } from "../utils/authStorage";

let refreshPromise;

const axiosClient = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:5212/api",

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 15000,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = readSession()?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original?.url?.startsWith("/auth/")) {
            const session = readSession();
            const refreshToken = session?.refreshToken;
            if (refreshToken && original && !original._retry) {
                original._retry = true;
                try {
                    refreshPromise ??= axios.post(`${axiosClient.defaults.baseURL}/auth/refresh`, { refreshToken }, { timeout: 15000 })
                        .then(({ data }) => {
                            const { accessToken, refreshToken: nextToken, ...user } = data.result;
                            store.dispatch(setCredentials({ accessToken, refreshToken: nextToken, user, remember: session.remember }));
                            return accessToken;
                        }).finally(() => { refreshPromise = null; });
                    const token = await refreshPromise;
                    original.headers.Authorization = `Bearer ${token}`;
                    return axiosClient(original);
                } catch { /* An expired session requires signing in again. */ }
            }
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
