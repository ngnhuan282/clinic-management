import {
    Avatar,
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import { getExaminationStatus } from "./examinationStatus";

function InfoItem({ label, value, highlight = false }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    color: "#6B7280",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                }}
            >
                {label}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    mt: 0.5,
                    color: highlight ? "#005DAC" : "#1F2937",
                    fontWeight: highlight ? 800 : 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {value || "-"}
            </Typography>
        </Box>
    );
}

function MedicalRecordPatientSummary({
    appointment,
    appointmentId,
    medicalRecord,
}) {
    const status = getExaminationStatus(
        appointment?.status || "waiting"
    );

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 2.5 },
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                bgcolor: "#FFFFFF",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
            >
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: 0, flex: 1 }}
                >
                    <Avatar
                        sx={{
                            width: 52,
                            height: 52,
                            bgcolor: appointment?.avatarColor || "#005DAC",
                            color:
                                appointment?.avatarTextColor ||
                                "#FFFFFF",
                            fontWeight: 900,
                        }}
                    >
                        {appointment?.initials || "BN"}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    color: "#111827",
                                    fontWeight: 900,
                                }}
                            >
                                {appointment?.patientName || "Bệnh nhân"}
                            </Typography>

                            <Chip
                                size="small"
                                label={status.shortLabel}
                                sx={{
                                    color: status.color,
                                    bgcolor: status.backgroundColor,
                                    border:
                                        `1px solid ${status.borderColor}`,
                                    fontWeight: 800,
                                }}
                            />
                        </Stack>

                        <Typography
                            variant="body2"
                            sx={{ mt: 0.5, color: "#6B7280" }}
                        >
                            Mã: {appointment?.patientCode || "-"}
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 2,
                        minWidth: { md: 520 },
                    }}
                >
                    <InfoItem
                        label="STT - giờ"
                        value={`${appointment?.queueNumber || appointmentId} · ${appointment?.time || "--:--"}`}
                        highlight
                    />
                    <InfoItem
                        label="Liên hệ"
                        value={appointment?.phone}
                    />
                    <InfoItem
                        label="Mã hồ sơ"
                        value={
                            medicalRecord?.medicalRecordId
                                ? `HS-${String(medicalRecord.medicalRecordId).padStart(5, "0")}`
                                : "Chưa lưu"
                        }
                    />
                </Box>
            </Stack>
        </Paper>
    );
}

export default MedicalRecordPatientSummary;
