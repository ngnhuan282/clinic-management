import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import formatDate from "../../../utils/formatDate";

function SummaryValue({ label, value }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 800, textTransform: "uppercase" }}>
                {label}
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, color: "#111827", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {value}
            </Typography>
        </Box>
    );
}

function MedicalHistoryPatientSummary({ summary }) {
    const initials = String(summary.patientName || "BN").trim().split(/\s+/)
        .map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("vi-VN");

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #E5E9F0" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(300px, 0.6fr)" }, gap: 3, alignItems: "center" }}>
                <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: "#EFF6FF", color: "#005DAC", fontWeight: 800 }}>
                        {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ color: "#111827", fontWeight: 800, overflowWrap: "anywhere" }}>
                            {summary.patientName}
                        </Typography>
                        <Stack direction="row" sx={{ gap: 2, mt: 0.5, flexWrap: "wrap" }}>
                            <Typography variant="body2" color="text.secondary">
                                Mã BN: <Box component="span" sx={{ color: "#005DAC", fontWeight: 700 }}>{summary.patientCode}</Box>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">SĐT: {summary.patientPhone || "Chưa có"}</Typography>
                        </Stack>
                        <Stack direction="row" sx={{ gap: 2, mt: 0.75, flexWrap: "wrap" }}>
                            {summary.birthDate && <Typography variant="body2" color="text.secondary">Ngày sinh: {formatDate(summary.birthDate)}</Typography>}
                            <Typography variant="body2" color="text.secondary">
                                Sổ của lượt khám: <Box component="span" sx={{ color: "#1F2937", fontWeight: 700 }}>{summary.patientBookNumber || "—"}</Box>
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2,
                    borderLeft: { lg: "1px solid #E5E9F0" }, borderTop: { xs: "1px solid #E5E9F0", lg: "none" },
                    pl: { lg: 3 }, pt: { xs: 2, lg: 0 } }}>
                    <SummaryValue label="Lượt đã hoàn tất" value={`${summary.totalCompletedVisits} lượt`} />
                    <SummaryValue label="Khám gần nhất" value={formatDate(summary.latestExaminationDate)} />
                </Box>
            </Box>
        </Paper>
    );
}

export default MedicalHistoryPatientSummary;
