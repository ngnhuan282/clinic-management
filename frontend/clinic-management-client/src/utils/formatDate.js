// src/utils/formatDate.js

export function formatDate(
    value,
    locale = "vi-VN"
) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        locale,
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(date);
}

export default formatDate;