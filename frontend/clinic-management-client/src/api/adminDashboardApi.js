import axiosClient from "./axiosClient";

const adminDashboardApi = {
    async getPeriod(from, to, signal) {
        const config = { params: { from, to }, signal };
        const [appointments, revenue] = await Promise.all([
            axiosClient.get("/admin-dashboard/appointments", config),
            axiosClient.get("/admin-dashboard/revenue", config),
        ]);
        return { appointments: appointments.data, revenue: revenue.data };
    },
};

export default adminDashboardApi;
