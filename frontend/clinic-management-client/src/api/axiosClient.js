import axios from "axios";

const axiosClient = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "https://localhost:5212/api",

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
        if (error.response?.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/login") window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
