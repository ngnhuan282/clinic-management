export const EXAMINATION_STATUSES = {
    waiting: {
        label: "Đang chờ khám",
        shortLabel: "Chờ khám",
        color: "#D97706",
        backgroundColor: "#FFFBEB",
        borderColor: "#FCD34D",
    },
    inProgress: {
        label: "Đang khám tại phòng",
        shortLabel: "Đang khám",
        color: "#005DAC",
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    priority: {
        label: "Ưu tiên lâm sàng",
        shortLabel: "Ưu tiên",
        color: "#DC2626",
        backgroundColor: "#FEF2F2",
        borderColor: "#FCA5A5",
    },
    completed: {
        label: "Đã hoàn tất",
        shortLabel: "Hoàn tất",
        color: "#059669",
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    absent: {
        label: "Vắng mặt",
        shortLabel: "Vắng mặt",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        borderColor: "#CBD5E1",
    },
};

export function normalizeExaminationStatus(status) {
    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (value === "pending" || value === "confirmed") {
        return "waiting";
    }

    if (value === "inprogress" || value === "in_progress") {
        return "inProgress";
    }

    if (value === "completed") {
        return "completed";
    }

    if (value === "cancelled" || value === "absent") {
        return "absent";
    }

    if (value === "priority") {
        return "priority";
    }

    return status;
}

export function getExaminationStatus(status) {
    const normalizedStatus = normalizeExaminationStatus(status);

    return EXAMINATION_STATUSES[normalizedStatus] || {
        label: status,
        shortLabel: status,
        color: "#374151",
        backgroundColor: "#F8FAFC",
        borderColor: "#E5E9F0",
    };
}
