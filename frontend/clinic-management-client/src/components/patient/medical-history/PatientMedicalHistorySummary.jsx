import { Avatar, Box, Stack, Typography } from "@mui/material";
import formatDate from "../../../utils/formatDate";

function PatientMedicalHistorySummary({ summary }) {
    const initials = summary.patientName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

    const metrics = [
        ["Lượt khám hoàn tất", `${summary.totalCompletedVisits} lượt`],
        ["Đơn thuốc đã kê", `${summary.totalPrescriptions} đơn`],
        [
            "Khám gần nhất",
            summary.latestExaminationDate ? formatDate(summary.latestExaminationDate) : "Chưa có",
        ],
    ];

    return (
        <Box
            sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #C5D8EC",
                borderRadius: "16px",
                p: { xs: 2.5, md: 3 },
                boxShadow: "0 2px 10px rgba(10, 37, 64, 0.04)",
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.05fr) minmax(0, 1fr)" },
                gap: 3,
                alignItems: "center",
            }}
        >
            <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
                <Avatar
                    sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "#0B4F8A",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: 18,
                    }}
                >
                    {initials}
                </Avatar>
                <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography component="h2" variant="h6" sx={{ color: "#0A2540", fontWeight: 800 }}>
                        {summary.patientName}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Mã BN:{" "}
                            <Box component="span" sx={{ color: "#0B4F8A", fontWeight: 800 }}>
                                {summary.patientCode}
                            </Box>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            SĐT: {summary.patientPhone || "Chưa có"}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        Ngày sinh: {formatDate(summary.birthDate)}
                    </Typography>
                </Box>
            </Stack>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 1.5,
                }}
            >
                {metrics.map(([label, value], index) => (
                    <Box
                        key={label}
                        sx={{
                            p: 1.75,
                            borderRadius: "12px",
                            bgcolor: "#EAF2FA",
                            border: "1px solid #B8D4F0",
                            gridColumn: { xs: index === 2 ? "1 / -1" : "auto", sm: "auto" },
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ color: "#334155", textTransform: "uppercase", fontWeight: 750, display: "block" }}
                        >
                            {label}
                        </Typography>
                        <Typography sx={{ color: "#0A2540", fontWeight: 800, fontSize: 18, mt: 0.4, fontVariantNumeric: "tabular-nums" }}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default PatientMedicalHistorySummary;
