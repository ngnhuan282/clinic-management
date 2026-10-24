export const DISPENSING_STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Ready", label: "Sẵn sàng cấp" },
    { value: "NeedsReview", label: "Cần rà soát" },
    { value: "AwaitingPayment", label: "Chờ thanh toán" },
    { value: "Dispensed", label: "Đã cấp" },
];

const STATUS_CONFIG = {
    NeedsReview: {
        label: "Cần rà soát",
        color: "#B91C1C",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
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

export const REVIEW_STATUS_OPTIONS = [
    { value: "NotRequested", label: "Chưa gửi yêu cầu" },
    { value: "Pending", label: "Đã gửi · Chờ xử lý" },
    { value: "Resolved", label: "Đã đóng yêu cầu" },
];

export function getReviewStatusLabel(status) {
    return REVIEW_STATUS_OPTIONS.find((x) => x.value === status)?.label || "Chưa gửi yêu cầu";
}

export function getDispensingPaymentLabel(status) {
    if (status === "Paid") return "Đã thanh toán";
    if (status === "PartiallyPaid") return "Thanh toán một phần";
    return "Chưa thanh toán";
}

export function getDispensingStatusConfig(status) {
    return STATUS_CONFIG[status] || {
        label: status || "Không xác định",
        color: "#475569",
        backgroundColor: "#F1F5F9",
        borderColor: "#CBD5E1",
    };
}
