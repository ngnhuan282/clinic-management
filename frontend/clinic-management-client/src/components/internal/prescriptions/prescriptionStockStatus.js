export const PRESCRIPTION_STOCK_STATUS_CONFIG = {
    Available: {
        label: "Đủ tồn",
        color: "#059669",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    LowStock: {
        label: "Tồn thấp",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    Insufficient: {
        label: "Thiếu tồn",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    OutOfStock: {
        label: "Hết tồn",
        color: "#DC2626",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
};

export function getPrescriptionStockStatusConfig(status) {
    return PRESCRIPTION_STOCK_STATUS_CONFIG[status] || {
        label: status || "Không rõ",
        color: "#6B7280",
        backgroundColor: "#F3F4F6",
        borderColor: "#E5E7EB",
    };
}
