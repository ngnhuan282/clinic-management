import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import MedicalHistoryPrescriptionSection from "../../internal/examinations/MedicalHistoryPrescriptionSection";
import MedicalRecordVitalSigns from "../../internal/examinations/MedicalRecordVitalSigns";
import PatientMedicineBillingSection from "./PatientMedicineBillingSection";
import formatDate from "../../../utils/formatDate";
import { Link } from "react-router-dom";

function ClinicalSection({ id, title, icon: Icon, children }) {
    return (
        <Box component="section" aria-labelledby={id} sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Stack
                direction="row"
                className="medical-history-field-heading"
                sx={{
                    gap: 1.25,
                    alignItems: "center",
                    px: 2.5,
                    py: 1.85,
                    minHeight: 56,
                    bgcolor: "#EAF2FA",
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Icon sx={{ color: "#0B4F8A", fontSize: 20, flexShrink: 0 }} />
                <Typography id={id} component="h3" variant="subtitle2" sx={{ color: "#0A2540", fontWeight: 800, lineHeight: 1.5, fontSize: 15 }}>
                    {title}
                </Typography>
            </Stack>
            <Box className="medical-history-clinical-content" sx={{ p: 2.5, flex: 1, minHeight: { xs: 88, md: 120 } }}>
                {children}
            </Box>
        </Box>
    );
}

function PatientMedicalHistoryDetail({ detail }) {
    const { record, prescription, departmentName, patientCode } = detail;
    const code = `HS-${String(record.medicalRecordId).padStart(5, "0")}`;
    const initials = String(record.patientName || "BN")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toLocaleUpperCase("vi-VN");
    const visitFields = [
        ["Bác sĩ", record.doctorName],
        ["Khoa", departmentName],
        ["Ngày khám", `${formatDate(record.appointmentDate)} · ${String(record.startTime).slice(0, 5)}`],
        ["Sổ khám", record.patientBookNumber || "Chưa ghi nhận"],
    ];

    return (
        <Paper
            component="section"
            aria-labelledby="patient-record-title"
            elevation={0}
            sx={{
                border: "1px solid #C5D8EC",
                borderRadius: "16px",
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow: "0 2px 12px rgba(10, 37, 64, 0.04)",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                    p: 2.5,
                    gap: 2,
                    alignItems: { sm: "center" },
                    justifyContent: "space-between",
                    bgcolor: "#EAF2FA",
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Stack direction="row" sx={{ gap: 1.25, alignItems: "center", minWidth: 0 }}>
                    <AssignmentOutlinedIcon sx={{ color: "#0B4F8A", flexShrink: 0 }} />
                    <Typography
                        id="patient-record-title"
                        component="h2"
                        variant="h6"
                        sx={{ color: "#0A2540", fontWeight: 800, overflowWrap: "anywhere" }}
                    >
                        Hồ sơ {code}
                    </Typography>
                </Stack>
                <Button
                    variant="outlined"
                    startIcon={<PrintOutlinedIcon />}
                    onClick={() => window.print()}
                    className="medical-history-no-print"
                    sx={{
                        flexShrink: 0,
                        alignSelf: { xs: "flex-start", sm: "center" },
                        borderRadius: "10px",
                        bgcolor: "#FFFFFF",
                        borderColor: "#90BCE6",
                        color: "#0B4F8A",
                        textTransform: "none",
                        fontWeight: 750,
                        "&:hover": { bgcolor: "#F4F8FC", borderColor: "#0B4F8A" },
                    }}
                >
                    In hồ sơ / Đơn thuốc
                </Button>
            </Stack>

            <Box
                className="medical-history-detail-identity"
                sx={{
                    p: 2.5,
                    display: "grid",
                    alignItems: "center",
                    gap: 3,
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.1fr)" },
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
                    <Avatar
                        sx={{
                            width: 52,
                            height: 52,
                            bgcolor: "#0B4F8A",
                            color: "#FFFFFF",
                            fontWeight: 800,
                        }}
                    >
                        {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        <Typography variant="caption" sx={{ color: "#0B4F8A", fontWeight: 750, letterSpacing: "0.04em" }}>
                            BỆNH NHÂN
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#0A2540", fontWeight: 800, mt: 0.2 }}>
                            {record.patientName}
                        </Typography>
                        <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap", mt: 0.4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Mã BN:{" "}
                                <Box component="span" sx={{ color: "#0B4F8A", fontWeight: 800 }}>
                                    {patientCode}
                                </Box>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                SĐT: {record.patientPhone || "Chưa có"}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
                <Box
                    component="dl"
                    sx={{
                        m: 0,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 2,
                        borderLeft: { md: "1px solid #C5D8EC" },
                        pl: { md: 3 },
                        borderTop: { xs: "1px solid #C5D8EC", md: 0 },
                        pt: { xs: 2, md: 0 },
                    }}
                >
                    {visitFields.map(([label, value]) => (
                        <Box key={label} sx={{ minWidth: 0 }}>
                            <Typography
                                component="dt"
                                variant="caption"
                                sx={{ color: "#475569", fontWeight: 750, textTransform: "uppercase" }}
                            >
                                {label}
                            </Typography>
                            <Typography
                                component="dd"
                                variant="body2"
                                sx={{
                                    m: 0,
                                    mt: 0.5,
                                    color: "#0A2540",
                                    fontWeight: 750,
                                    overflowWrap: "anywhere",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {value || "Chưa ghi nhận"}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box
                className="medical-history-clinical-grid"
                sx={{
                    display: "grid",
                    borderBottom: "1px solid #C5D8EC",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
                    "& > section + section": {
                        borderLeft: { md: "1px solid #C5D8EC" },
                        borderTop: { xs: "1px solid #C5D8EC", md: 0 },
                    },
                }}
            >
                <ClinicalSection
                    id="patient-record-symptoms"
                    title="Triệu chứng ghi nhận"
                    icon={AssignmentTurnedInOutlinedIcon}
                >
                    <Typography
                        variant="body2"
                        sx={{ color: "#1E293B", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.75 }}
                    >
                        {record.symptoms || "Chưa ghi nhận triệu chứng."}
                    </Typography>
                </ClinicalSection>

                <ClinicalSection id="patient-record-diagnoses" title="Chẩn đoán" icon={FactCheckOutlinedIcon}>
                    <Stack sx={{ gap: 1.5 }}>
                        {record.diagnoses.length ? (
                            record.diagnoses.map((diagnosis, index) => (
                                <Box
                                    key={diagnosis.diseaseId}
                                    sx={{ borderTop: index ? "1px solid #E2ECF5" : 0, pt: index ? 1.5 : 0 }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "#0A2540", fontWeight: 750, overflowWrap: "anywhere" }}
                                    >
                                        {diagnosis.diseaseCode} - {diagnosis.diseaseName}
                                    </Typography>
                                    {diagnosis.isPrimary && (
                                        <Chip
                                            size="small"
                                            label="Chẩn đoán chính"
                                            sx={{
                                                mt: 0.85,
                                                height: 24,
                                                bgcolor: "#E6F0FA",
                                                color: "#0B4F8A",
                                                fontWeight: 750,
                                                borderRadius: "6px",
                                            }}
                                        />
                                    )}
                                    {diagnosis.note && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 0.85, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}
                                        >
                                            Ghi chú: {diagnosis.note}
                                        </Typography>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Chưa có chẩn đoán.
                            </Typography>
                        )}
                    </Stack>
                </ClinicalSection>

                <ClinicalSection id="patient-record-conclusion" title="Kết luận" icon={CheckCircleOutlineOutlinedIcon}>
                    <Typography
                        variant="body2"
                        sx={{ color: "#1E293B", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.75 }}
                    >
                        {record.conclusion || "Chưa có kết luận."}
                    </Typography>
                </ClinicalSection>
            </Box>

            <Box sx={{ borderBottom: "1px solid #C5D8EC" }}>
                <ClinicalSection id="patient-record-vital-signs" title="Chỉ số sinh tồn" icon={MonitorHeartOutlinedIcon}>
                    <MedicalRecordVitalSigns record={record} />
                </ClinicalSection>
            </Box>

            <MedicalHistoryPrescriptionSection prescription={prescription} embedded />

            {prescription && (
                <PatientMedicineBillingSection
                    billing={detail.medicineBilling}
                    prescriptionCode={prescription.prescriptionCode}
                />
            )}

            <Box
                className="medical-history-no-print"
                sx={{
                    p: 2.5,
                    borderTop: "1px solid #C5D8EC",
                    bgcolor: "#F4F7FA",
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                }}
            >
                <Button
                    component={Link}
                    to="/booking"
                    variant="contained"
                    startIcon={<CalendarMonthOutlinedIcon />}
                    sx={{
                        borderRadius: "10px",
                        fontWeight: 750,
                        textTransform: "none",
                        bgcolor: "#0B4F8A",
                        "&:hover": { bgcolor: "#083A66" },
                    }}
                >
                    Đặt lịch khám mới
                </Button>
            </Box>
        </Paper>
    );
}

export default PatientMedicalHistoryDetail;
