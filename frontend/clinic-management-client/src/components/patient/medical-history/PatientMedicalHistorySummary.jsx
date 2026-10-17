import { Avatar, Box, Stack, Typography } from "@mui/material";
import formatDate from "../../../utils/formatDate";

function PatientMedicalHistorySummary({ summary }) {
    const initials = summary.patientName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
    const metrics = [
        ["Lượt khám hoàn tất", `${summary.totalCompletedVisits} lượt`],
        ["Đơn thuốc", `${summary.totalPrescriptions} đơn`],
        ["Khám gần nhất", summary.latestExaminationDate ? formatDate(summary.latestExaminationDate) : "Chưa có"],
    ];

    return (
        <Box sx={{ bgcolor: "#FFFFFF", borderBlock: "1px solid #E5E9F0", p: { xs: 2.5, md: 3 },
            display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.1fr) minmax(0, 1fr)" }, gap: 3 }}>
            <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "#EFF6FF", color: "#005DAC", fontWeight: 800 }}>{initials}</Avatar>
                <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography component="h2" variant="h6" sx={{ color: "#111827", fontWeight: 800 }}>{summary.patientName}</Typography>
                    <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Mã BN: <Box component="span" sx={{ color: "#005DAC", fontWeight: 700 }}>{summary.patientCode}</Box></Typography>
                        <Typography variant="body2" color="text.secondary">SĐT: {summary.patientPhone || "Chưa có"}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ngày sinh: {formatDate(summary.birthDate)}</Typography>
                </Box>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2.5,
                borderLeft: { lg: "1px solid #E5E9F0" }, pl: { lg: 3 }, alignItems: "center" }}>
                {metrics.map(([label, value], index) => <Box key={label} sx={{ gridColumn: { xs: index === 2 ? "1 / -1" : "auto", sm: "auto" } }}>
                    <Typography variant="caption" sx={{ color: "#6B7280", textTransform: "uppercase", fontWeight: 800 }}>{label}</Typography>
                    <Typography variant="h6" sx={{ color: "#111827", fontWeight: 800, mt: 0.5 }}>{value}</Typography>
                </Box>)}
            </Box>
        </Box>
    );
}

export default PatientMedicalHistorySummary;
