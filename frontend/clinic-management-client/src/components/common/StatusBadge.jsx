import { Chip } from "@mui/material";

const STATUS_CONFIG = {
    Pending: {
        label: "Chờ xác nhận",
        color: "warning",
        sx: { bgcolor: "#FFFBEB", color: "#92400E", borderColor: "#FCD34D" },
    },
    Confirmed: {
        label: "Đã xác nhận",
        color: "primary",
        sx: { bgcolor: "#E6F0FA", color: "#0B4F8A", borderColor: "#90BCE6" },
    },
    InProgress: {
        label: "Đang khám",
        color: "info",
        sx: { bgcolor: "#DBEAFE", color: "#1E40AF", borderColor: "#93C5FD" },
    },
    Completed: {
        label: "Hoàn tất",
        color: "success",
        sx: { bgcolor: "#ECFDF5", color: "#065F46", borderColor: "#6EE7B7" },
    },
    Cancelled: {
        label: "Đã hủy",
        color: "error",
        sx: { bgcolor: "#FEF2F2", color: "#991B1B", borderColor: "#FCA5A5" },
    },
    Unpaid: {
        label: "Unpaid",
        color: "warning",
        sx: { bgcolor: "#FFFBEB", color: "#92400E", borderColor: "#FCD34D" },
    },
    Paid: {
        label: "Paid",
        color: "success",
        sx: { bgcolor: "#ECFDF5", color: "#065F46", borderColor: "#6EE7B7" },
    },
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        color: "default",
        sx: { bgcolor: "#F1F5F9", color: "#334155", borderColor: "#CBD5E1" },
    };

    return (
        <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
            sx={{
                fontWeight: 700,
                fontSize: 12.5,
                borderRadius: "8px",
                px: 0.5,
                ...config.sx,
            }}
        />
    );
}

export default StatusBadge;
