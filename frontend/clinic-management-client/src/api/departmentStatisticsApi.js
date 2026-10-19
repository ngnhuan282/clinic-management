import axiosClient from "./axiosClient";
import { readDepartmentStatistics } from "../utils/departmentStatistics";

/**
 * A7 v1.0: all dates are yyyy-MM-dd; the server resolves the user's department.
 * @returns {Promise<{departmentId: number, departmentName: string, fromDate: string,
 * toDate: string, visitCount: number, pendingScheduleRequestCount: number,
 * approvedScheduleRequestCount: number}>}
 */
export async function getDepartmentStatistics(params, signal) {
    const response = await axiosClient.get("/department-head/statistics", { params, signal });
    return readDepartmentStatistics(response.data);
}
