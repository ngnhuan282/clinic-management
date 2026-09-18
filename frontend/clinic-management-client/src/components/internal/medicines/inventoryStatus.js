export const INVENTORY_STATUS_OPTIONS = [
    {
        value: "",
        label: "Tất cả trạng thái",
    },
    {
        value: "InStock",
        label: "Còn hàng",
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

export const INVENTORY_STATUS_CONFIG = {
    InStock: {
        label: "Còn hàng",
        color: "#047857",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
        rowBackground: "#FFFFFF",
    },
    LowStock: {
        label: "Tồn thấp",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
        rowBackground: "#FFFBEB",
    },
    OutOfStock: {
        label: "Hết hàng",
        color: "#E11D48",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECDD3",
        rowBackground: "#FFF7F7",
    },
    ExpiringSoon: {
        label: "Sắp hết hạn",
        color: "#C2410C",
        backgroundColor: "#FFF7ED",
        borderColor: "#FDBA74",
        rowBackground: "#FFF7ED",
    },
    Expired: {
        label: "Đã hết hạn",
        color: "#991B1B",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        rowBackground: "#FFF1F2",
    },
};

export function getInventoryStatusConfig(status) {
    return INVENTORY_STATUS_CONFIG[status] || {
        label: status || "Không rõ",
        color: "#6B7280",
        backgroundColor: "#F3F4F6",
        borderColor: "#E5E7EB",
        rowBackground: "#FFFFFF",
    };
}
