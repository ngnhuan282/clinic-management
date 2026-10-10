export const DISPENSING_STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Ready", label: "Sẵn sàng cấp" },
    { value: "AwaitingPayment", label: "Chờ thanh toán" },
    { value: "Dispensed", label: "Đã cấp" },
];

const STATUS_CONFIG = {
    Ready: {
        label: "Sẵn sàng cấp",
        color: "#047857",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    AwaitingPayment: {
        label: "Chờ thanh toán",
        color: "#B45309",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    Dispensed: {
        label: "Đã cấp",
        color: "#1D4ED8",
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
};

export function getDispensingStatusConfig(status) {
    return STATUS_CONFIG[status] || {
        label: status || "Không xác định",
        color: "#475569",
        backgroundColor: "#F1F5F9",
        borderColor: "#CBD5E1",
    };
}
