export const clinicToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
export const parseDate = value => new Date(`${value}T12:00:00`);
export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function addDays(value, count) {
    const date = parseDate(value);
    date.setDate(date.getDate() + count);
    return dateKey(date);
}
export function mondayOf(value) {
    const weekday = parseDate(value).getDay();
    return addDays(value, -((weekday + 6) % 7));
}
export const formatDay = value => parseDate(value).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
export const shortTime = value => value.slice(0, 5);
