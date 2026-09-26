import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";

import { getExaminationStatus } from "./examinationStatus";

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    return String(value).slice(0, 5);
}

function InfoItem({ label, value, highlight = false }) {
    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    color: "#6B7280",
                    fontWeight: 800,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    mt: 0.35,
                    color: highlight ? "#005DAC" : "#1F2937",
                    fontWeight: highlight ? 900 : 700,
                    lineHeight: 1.5,
                }}
            >
                {value || "-"}
            </Typography>
        </Box>
    );
}

function MedicalRecordAuditPanel({ record }) {
    const status = getExaminationStatus(record?.status);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                bgcolor: "#FFFFFF",
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 1.5,
                            color: "#005DAC",
                            bgcolor: "#EFF6FF",
                        }}
                    >
                        <EventNoteOutlinedIcon fontSize="small" />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: "#1F2937",
                                fontWeight: 900,
                            }}
                        >
                            Thông tin hồ sơ
                        </Typography>
                    </Box>

                    <Chip
                        size="small"
                        label={status.shortLabel}
                        sx={{
                            color: status.color,
                            bgcolor: status.backgroundColor,
                            border: `1px solid ${status.borderColor}`,
                            fontWeight: 900,
                        }}
                    />
                </Stack>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 1.75,
                        pt: 1,
                    }}
                >
                    <InfoItem
                        label="Mã hồ sơ"
                        value={
                            record?.medicalRecordId
                                ? `HS-${String(record.medicalRecordId).padStart(5, "0")}`
                                : "-"
                        }
                        highlight
                    />

                    <InfoItem
                        label="Bác sĩ phụ trách"
                        value={record?.doctorName}
                    />

                    <InfoItem
                        label="Ngày khám"
                        value={`${formatDate(record?.appointmentDate)} · ${formatTime(record?.startTime)}`}
                    />

                    <InfoItem
                        label="Tạo hồ sơ"
                        value={formatDateTime(record?.createdAt)}
                    />

                    <InfoItem
                        label="Cập nhật gần nhất"
                        value={formatDateTime(record?.updatedAt)}
                    />
                </Box>
            </Stack>
        </Paper>
    );
}

export default MedicalRecordAuditPanel;
