const clinicTimeZone = "Asia/Ho_Chi_Minh";
const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: clinicTimeZone,
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

function formatTimestamp(value, defaultOffset) {
    if (typeof value !== "string" || !value.trim()) return "-";
    const timestamp = value.trim();
    const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)
        ? timestamp : `${timestamp}${defaultOffset}`);
    return Number.isNaN(date.getTime()) ? "-" : formatter.format(date);
}

// SQL DateTime values can omit their zone: audit fields are UTC, paper confirmation is clinic-local.
export const formatMedicalRecordUtcTime = value => formatTimestamp(value, "Z");
export const formatMedicalRecordPaperTime = value => formatTimestamp(value, "+07:00");
