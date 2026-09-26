// src/components/common/StatusBadge.jsx

import { Chip } from "@mui/material";

const STATUS_CONFIG = {
    Pending: {
        label: "Chờ xác nhận",
        color: "warning",
    },
    Confirmed: {
        label: "Đã xác nhận",
        color: "primary",
    },
    InProgress: {
        label: "Đang khám",
        color: "info",
    },
    Completed: {
        label: "Hoàn tất",
        color: "success",
    },
    Cancelled: {
        label: "Đã hủy",
        color: "error",
    },
    Unpaid: {
        label: "Unpaid",
        color: "warning",
    },
    Paid: {
        label: "Paid",
        color: "success",
    },
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        color: "default",
    };

    return (
        <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
        />
    );
}

export default StatusBadge;
