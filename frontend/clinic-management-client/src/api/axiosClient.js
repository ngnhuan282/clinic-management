import axios from "axios";
import store from "../store/store";
import { setCredentials, logout } from "../store/authSlice";

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
        const token = localStorage.getItem("accessToken");
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
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken && original && !original._retry) {
                original._retry = true;
                try {
                    refreshPromise ??= axios.post(`${axiosClient.defaults.baseURL}/auth/refresh`, { refreshToken })
                        .then(({ data }) => {
                            const { accessToken, refreshToken: nextToken, ...user } = data.result;
                            store.dispatch(setCredentials({ accessToken, refreshToken: nextToken, user }));
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
