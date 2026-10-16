export const INVENTORY_STOCK_LEVEL_OPTIONS = [
    {
        value: "",
        label: "Tất cả lượng tồn",
    },
    {
        value: "InStock",
        label: "Tồn bình thường",
    },
    {
        value: "LowStock",
        label: "Tồn thấp",
    },
    {
        value: "OutOfStock",
        label: "Hết hàng",
    },
];

export const INVENTORY_EXPIRY_OPTIONS = [
    { value: "", label: "Tất cả hạn dùng" },
    { value: "Valid", label: "Trên 30 ngày" },
    { value: "ExpiringSoon", label: "Sắp hết hạn (0-30 ngày)" },
    { value: "Expired", label: "Đã hết hạn" },
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

export function getInventoryStatuses(item) {
    const stockLevel = item.stockLevel || (item.quantityInStock <= 0
        ? "OutOfStock" : item.quantityInStock <= 10 ? "LowStock" : "InStock");
    const expiryStatus = item.expiryStatus || (item.daysUntilExpiry < 0
        ? "Expired" : item.daysUntilExpiry <= 30 ? "ExpiringSoon" : "Valid");
    const statuses = [];
    if (expiryStatus !== "Valid") statuses.push(expiryStatus);
    if (stockLevel !== "InStock") statuses.push(stockLevel);
    return statuses.length ? statuses : ["InStock"];
}

export function getInventoryExpiryText(item) {
    if (item.daysUntilExpiry < 0) return `Quá hạn ${Math.abs(item.daysUntilExpiry)} ngày`;
    if (item.daysUntilExpiry === 0) return "Hết hạn hôm nay";
    return `Còn ${item.daysUntilExpiry} ngày`;
}
