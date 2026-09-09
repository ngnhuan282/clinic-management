// src/utils/formatCurrency.js

export function formatCurrency(
    value,
    currency = "VND"
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "-";
    }

    return new Intl.NumberFormat(
        "vi-VN",
        {
            style: "currency",
            currency,
        }
    ).format(value);
}

export default formatCurrency;