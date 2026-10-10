export const PURCHASE_ORDER_STATUS = {
    draft: {
        label: "Bản nháp",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    received: {
        label: "Đã nhập kho",
        color: "#047857",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    cancelled: {
        label: "Đã hủy",
        color: "#DC2626",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
};

export const PURCHASE_ORDER_STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Draft", label: "Bản nháp" },
    { value: "Received", label: "Đã nhập kho" },
    { value: "Cancelled", label: "Đã hủy" },
];

export function getPurchaseOrderStatusConfig(status) {
    return PURCHASE_ORDER_STATUS[status?.toLowerCase()] || {
        label: status || "Không xác định",
        color: "#475569",
        backgroundColor: "#F8FAFC",
        borderColor: "#CBD5E1",
    };
}
