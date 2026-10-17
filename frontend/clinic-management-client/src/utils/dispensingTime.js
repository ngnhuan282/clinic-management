export function formatDispensedAt(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const timestamp = value.trim();
    // DispensedAt is stored as clinic-local time, unlike UTC review timestamps.
    const zonedTimestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)
        ? timestamp : `${timestamp}+07:00`;
    const date = new Date(zonedTimestamp);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
    }).format(date);
}
