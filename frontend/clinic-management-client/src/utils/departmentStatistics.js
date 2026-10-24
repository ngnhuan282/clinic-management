import { clinicToday } from "./scheduleCalendar.js";

export function currentStatisticsMonth(today = clinicToday()) {
    const [year, month] = today.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { fromDate: `${today.slice(0, 7)}-01`, toDate: `${today.slice(0, 7)}-${lastDay}` };
}

const isDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function statisticsDateErrors({ fromDate, toDate }) {
    const errors = {};
    if (!isDate(fromDate)) errors.fromDate = "Chọn ngày bắt đầu hợp lệ.";
    if (!isDate(toDate)) errors.toDate = "Chọn ngày kết thúc hợp lệ.";
    if (!errors.fromDate && !errors.toDate && fromDate > toDate)
        errors.toDate = "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
    if (toDate === "9999-12-31") errors.toDate = "Ngày kết thúc phải trước 31/12/9999.";
    return errors;
}

// Reject an unavailable or incompatible source instead of displaying fabricated zeroes.
export function readDepartmentStatistics(envelope) {
    const data = envelope?.result;
    const counts = ["visitCount", "pendingScheduleRequestCount", "approvedScheduleRequestCount"];
    if (envelope?.code !== 1000 || !data || !Number.isInteger(data.departmentId) || data.departmentId <= 0
        || typeof data.departmentName !== "string" || !data.departmentName.trim()
        || Object.keys(statisticsDateErrors(data)).length
        || counts.some(key => !Number.isSafeInteger(data[key]) || data[key] < 0))
        throw new Error("Dữ liệu thống kê chưa sẵn sàng hoặc không đúng định dạng. Vui lòng thử lại.");
    return data;
}
