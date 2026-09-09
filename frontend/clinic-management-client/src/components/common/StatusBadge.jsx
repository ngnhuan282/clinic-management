// src/components/common/StatusBadge.jsx

import { Chip } from "@mui/material";

const STATUS_CONFIG = {
    Pending: {
        label: "Pending",
        color: "warning",
    },
    Confirmed: {
        label: "Confirmed",
        color: "primary",
    },
    InProgress: {
        label: "In Progress",
        color: "info",
    },
    Completed: {
        label: "Completed",
        color: "success",
    },
    Cancelled: {
        label: "Cancelled",
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