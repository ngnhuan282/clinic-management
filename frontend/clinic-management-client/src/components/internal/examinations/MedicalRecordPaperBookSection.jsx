import { useState } from "react";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PaperBookConfirmDialog from "./PaperBookConfirmDialog";

function formatDateTime(value) {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function MedicalRecordPaperBookSection({
    appointment, medicalRecord, form, diseases, selectedDiagnoses, prescription,
    checkingPrescription, prescriptionError, onPrescriptionRetry, saving, updateField,
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const hasPatientBook = Boolean(medicalRecord?.patientBookId || appointment?.patientBookId);
    const bookNumber = medicalRecord?.patientBookNumber || appointment?.patientBookNumber;
    const isBookVerified = Boolean(hasPatientBook && bookNumber && (medicalRecord?.bookVerifiedAt || appointment?.bookVerifiedAt));
    const isConfirmed = Boolean(isBookVerified && form.paperBookConfirmed);
    const hasSavedConfirmation = Boolean(isConfirmed && !form.paperBookConfirmationPending && medicalRecord?.paperBookUpdatedAt);
    const handleConfirm = () => {
        updateField("paperBookConfirmed", true);
        setDialogOpen(false);
    };

    return (
        <Paper component="section" aria-labelledby="medical-record-paper-book-title" elevation={0}
            sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid #E5E9F0", borderRadius: 2, bgcolor: "#FFFFFF", minWidth: 0, "& *": { letterSpacing: 0 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}>
                <Stack direction="row" sx={{ gap: 1.25, alignItems: "center", minWidth: 0 }}>
                    <Box sx={{ width: 34, height: 34, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "#EFF6FF", color: "#005DAC" }}>
                        <MenuBookOutlinedIcon fontSize="small" />
                    </Box>
                    <Typography id="medical-record-paper-book-title" component="h2" variant="subtitle1" sx={{ color: "#1F2937", fontWeight: 800 }}>5. Sổ khám giấy</Typography>
                </Stack>
                {isConfirmed ? <Stack direction="row" role="status" sx={{ gap: 0.75, alignItems: "center", color: "#047857" }}>
                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Đã xác nhận</Typography>
                </Stack> : <Button variant="outlined" startIcon={<CheckCircleOutlineOutlinedIcon />}
                    disabled={!isBookVerified || saving} onClick={() => setDialogOpen(true)} sx={{ flexShrink: 0, minHeight: 42 }}>
                    Xác nhận cập nhật sổ giấy
                </Button>}
            </Stack>
            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderTop: "1px solid #E5E9F0", borderBottom: "1px solid #E5E9F0" }}>
                <Stack direction="row" sx={{ gap: 2, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>MÃ SỔ KHÁM GIẤY</Typography>
                        <Typography variant="subtitle1" sx={{ mt: 0.25, color: "#111827", fontWeight: 800, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>
                            {bookNumber || (hasPatientBook ? "Chưa tải được mã sổ" : "Chưa có sổ khám")}
                        </Typography>
                    </Box>
                    <Chip size="small" label={isBookVerified ? "Sổ đã được kiểm tra" : "Sổ chưa được kiểm tra"} sx={{ borderRadius: 1, fontWeight: 700,
                        bgcolor: isBookVerified ? "#ECFDF5" : "#FFFBEB", color: isBookVerified ? "#047857" : "#B45309" }} />
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap", mt: 1 }}>
                    <Typography variant="body2" sx={{ color: "#374151", overflowWrap: "anywhere" }}>Bệnh nhân: <Box component="span" sx={{ color: "#1F2937", fontWeight: 700 }}>{appointment?.patientName}</Box></Typography>
                    <Typography variant="body2" color="text.secondary">{appointment?.patientCode?.startsWith("BN-") ? "Mã BN" : "Mã lượt"}: {appointment?.patientCode}</Typography>
                    <Typography variant="body2" color="text.secondary">SĐT: {appointment?.phone || "Chưa có"}</Typography>
                </Stack>
            </Box>
            {!isBookVerified ? <Alert severity="warning" sx={{ mt: 2 }}>Lượt khám chưa có sổ giấy được đối chiếu.</Alert> : hasSavedConfirmation ?
                <Alert severity="success" sx={{ mt: 2 }}>Đã ghi nhận cập nhật sổ giấy lúc {formatDateTime(medicalRecord.paperBookUpdatedAt)}.</Alert> : isConfirmed ?
                    <Alert severity="info" sx={{ mt: 2 }}>Đã xác nhận cập nhật sổ giấy, chưa lưu hồ sơ.</Alert> :
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{medicalRecord?.paperBookUpdatedAt
                        ? "Nội dung khám đã thay đổi. Vui lòng cập nhật sổ giấy và xác nhận lại."
                        : "Chưa xác nhận cập nhật sổ giấy."}</Typography>}
            {dialogOpen && <PaperBookConfirmDialog appointment={appointment} bookNumber={bookNumber} isBookVerified={isBookVerified}
                form={form} diseases={diseases} selectedDiagnoses={selectedDiagnoses} prescription={prescription}
                checkingPrescription={checkingPrescription} prescriptionError={prescriptionError} onPrescriptionRetry={onPrescriptionRetry}
                saving={saving} onClose={() => setDialogOpen(false)} onConfirm={handleConfirm} />}
        </Paper>
    );
}

export default MedicalRecordPaperBookSection;
