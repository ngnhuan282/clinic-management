export const STOCK_STATUS_OPTIONS = [
    {
        value: "",
        label: "Tất cả trạng thái",
    },
    {
        value: "InStock",
        label: "Đủ tồn",
    },
    {
        value: "LowStock",
        label: "Tồn thấp",
    },
    {
        value: "OutOfStock",
        label: "Hết hàng",
    },
    {
        value: "ExpiringSoon",
        label: "Sắp hết hạn",
    },
    {
        value: "Expired",
        label: "Đã hết hạn",
    },
];

export const STOCK_STATUS_CONFIG = {
    InStock: {
        label: "Đủ tồn",
        color: "#10B981",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    LowStock: {
        label: "Tồn thấp",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    OutOfStock: {
        label: "Hết hàng",
        color: "#E11D48",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECDD3",
    },
    ExpiringSoon: {
        label: "Sắp hết hạn",
        color: "#7C3AED",
        backgroundColor: "#F5F3FF",
        borderColor: "#DDD6FE",
    },
    Expired: {
        label: "Đã hết hạn",
        color: "#991B1B",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
};

export function getStockStatusConfig(status) {
    return STOCK_STATUS_CONFIG[status] || {
        label: status || "Không rõ",
        color: "#6B7280",
        backgroundColor: "#F3F4F6",
        borderColor: "#E5E7EB",
    };
}
