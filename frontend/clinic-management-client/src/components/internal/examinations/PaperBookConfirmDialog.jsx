import { useState } from "react";
import {
    Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, Tooltip, Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { getDiseaseLabel } from "./diseaseLabel";

function ClinicalSummaryField({ label, children }) {
    return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "132px minmax(0, 1fr)" }, minWidth: 0 }}>
        <Typography component="dt" variant="body2"
            sx={{ px: 1.5, py: { xs: 1, sm: 1.5 }, color: "#4B5563", fontWeight: 600, bgcolor: "#F8FAFC" }}>{label}</Typography>
        <Box component="dd" sx={{ m: 0, p: 1.5, minWidth: 0, color: "#374151", overflowWrap: "anywhere", whiteSpace: "pre-wrap",
            borderLeft: { sm: "1px solid #E5E9F0" } }}>{children}</Box>
    </Box>;
}

function formatUnit(unit) {
    const units = { vien: "viên", goi: "gói", binh: "bình", but: "bút", hop: "hộp", chai: "chai" };
    return units[unit?.trim().toLowerCase()] || unit || "đơn vị";
}

function PaperBookConfirmDialog({
    appointment, bookNumber, isBookVerified, form, diseases, selectedDiagnoses,
    prescription, checkingPrescription, prescriptionError, onPrescriptionRetry, saving, onClose, onConfirm,
}) {
    const [checked, setChecked] = useState(false);
    const clinicalReady = Boolean(form.symptoms.trim() && form.conclusion.trim() && selectedDiagnoses.length);
    const canConfirm = isBookVerified && clinicalReady && !checkingPrescription && !prescriptionError && !saving;
    const activePrescription = prescription?.status !== "Cancelled" ? prescription : null;

    return (
        <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="paper-book-confirm-title"
            slotProps={{ paper: { sx: { m: { xs: 2, sm: 3 }, width: { xs: "calc(100% - 32px)", sm: "calc(100% - 48px)" }, borderRadius: 2,
                maxHeight: "calc(100dvh - 32px)", "& *": { letterSpacing: 0 } } } }}>
            <DialogTitle component="div" id="paper-book-confirm-header" sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #E5E9F0" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "36px minmax(0, 1fr) 36px", gap: 1.5, alignItems: "start" }}>
                    <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", bgcolor: "#EFF6FF", color: "#005DAC", borderRadius: 1 }}>
                        <MenuBookOutlinedIcon fontSize="small" />
                    </Box>
                    <Typography id="paper-book-confirm-title" component="h2" variant="h6" sx={{ color: "#111827", fontWeight: 800, lineHeight: 1.4, fontSize: 18, pt: 0.5 }}>
                        Xác nhận cập nhật sổ khám giấy
                    </Typography>
                    <Tooltip title="Đóng xác nhận">
                        <IconButton aria-label="Đóng xác nhận sổ giấy" onClick={onClose} disabled={saving}
                            sx={{ width: 36, height: 36, border: "1px solid #E5E9F0", bgcolor: "#F8FAFC", color: "#6B7280" }}>
                            <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, pt: "0 !important" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) auto" }, gap: 2,
                    p: { xs: 2, sm: 2.5 }, bgcolor: "#EFF6FF", borderBottom: "1px solid #E5E9F0" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>BỆNH NHÂN</Typography>
                        <Typography variant="subtitle1" sx={{ color: "#111827", fontWeight: 800, overflowWrap: "anywhere" }}>{appointment?.patientName}</Typography>
                        <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap", mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">{appointment?.patientCode?.startsWith("BN-") ? "Mã BN" : "Mã lượt"}: {appointment?.patientCode}</Typography>
                            <Typography variant="body2" color="text.secondary">SĐT: {appointment?.phone || "Chưa có"}</Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ minWidth: 0, textAlign: { xs: "left", sm: "right" } }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>MÃ SỔ KHÁM GIẤY</Typography>
                        <Typography variant="subtitle1" sx={{ color: "#005DAC", fontWeight: 800, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{bookNumber}</Typography>
                    </Box>
                </Box>

                <Box component="section" aria-labelledby="paper-book-clinical-title" sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #E5E9F0" }}>
                    <Stack direction="row" sx={{ gap: 1.25, alignItems: "center", mb: 2 }}>
                        <AssignmentOutlinedIcon sx={{ color: "#005DAC", fontSize: 20, flexShrink: 0 }} />
                        <Typography id="paper-book-clinical-title" component="h3" variant="subtitle2" sx={{ color: "#1F2937", fontWeight: 800 }}>Tóm tắt lượt khám</Typography>
                    </Stack>
                    <Box component="dl" sx={{ m: 0, border: "1px solid #E5E9F0", borderRadius: 1, overflow: "hidden",
                        "& > div + div": { borderTop: "1px solid #E5E9F0" } }}>
                        <ClinicalSummaryField label="Triệu chứng"><Typography variant="body2" sx={{ lineHeight: 1.7 }}>{form.symptoms.trim() || "Chưa nhập triệu chứng."}</Typography></ClinicalSummaryField>
                        <ClinicalSummaryField label="Chẩn đoán">
                            <Stack sx={{ gap: 1 }}>
                                {selectedDiagnoses.length ? selectedDiagnoses.map((diagnosis) => {
                                    const disease = diseases.find((item) => Number(item.diseaseId) === diagnosis.diseaseId);
                                    return <Box key={diagnosis.diseaseId}>
                                        <Stack direction="row" sx={{ gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
                                            <Typography variant="body2" sx={{ color: "#111827", fontWeight: 700 }}>{disease ? getDiseaseLabel(disease) : `Bệnh #${diagnosis.diseaseId}`}</Typography>
                                            {diagnosis.isPrimary && <Chip size="small" label="Chính" sx={{ bgcolor: "#EFF6FF", color: "#005DAC", height: 22, borderRadius: 1 }} />}
                                        </Stack>
                                        {diagnosis.note && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ghi chú: {diagnosis.note}</Typography>}
                                    </Box>;
                                }) : <Typography variant="body2" color="text.secondary">Chưa chọn chẩn đoán.</Typography>}
                            </Stack>
                        </ClinicalSummaryField>
                        <ClinicalSummaryField label="Kết luận"><Typography variant="body2" sx={{ lineHeight: 1.7 }}>{form.conclusion.trim() || "Chưa nhập kết luận."}</Typography></ClinicalSummaryField>
                    </Box>
                </Box>

                <Box component="section" aria-labelledby="paper-book-prescription-title" sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #E5E9F0" }}>
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
                        <Stack direction="row" sx={{ gap: 1.25, alignItems: "center" }}>
                            <LocalPharmacyOutlinedIcon sx={{ color: "#005DAC", fontSize: 20, flexShrink: 0 }} />
                            <Typography id="paper-book-prescription-title" component="h3" variant="subtitle2" sx={{ color: "#1F2937", fontWeight: 800 }}>Đơn thuốc</Typography>
                        </Stack>
                        {activePrescription && <Typography variant="body2" sx={{ color: "#005DAC", fontWeight: 700 }}>{activePrescription.prescriptionCode}</Typography>}
                    </Stack>
                    {checkingPrescription ? <Stack direction="row" role="status" sx={{ gap: 1.5, alignItems: "center" }}>
                        <CircularProgress size={18} /><Typography variant="body2" color="text.secondary">Đang tải đơn thuốc...</Typography>
                    </Stack> : prescriptionError ? <Alert severity="error" action={
                        <Button size="small" color="inherit" startIcon={<RefreshOutlinedIcon />} onClick={onPrescriptionRetry}>Thử lại</Button>
                    }>{prescriptionError}</Alert> : !activePrescription ?
                        <Typography variant="body2" color="text.secondary">{prescription?.status === "Cancelled" ? `Đơn thuốc ${prescription.prescriptionCode} đã hủy.` : "Lượt khám chưa có đơn thuốc."}</Typography> : <>
                            <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
                                {activePrescription.details.map((item, index) => <Box component="li" key={item.prescriptionDetailId}
                                    sx={{ py: 1.5, borderTop: index ? "1px solid #E5E9F0" : 0, "&:first-of-type": { pt: 0 }, "&:last-of-type": { pb: 0 } }}>
                                    <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start", justifyContent: "space-between" }}>
                                        <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere", color: "#111827", fontWeight: 700 }}>{index + 1}. {item.medicineName}</Typography>
                                        <Chip size="small" label={`${item.quantity} ${formatUnit(item.unit)}`} sx={{ flexShrink: 0, maxWidth: "40%", height: "auto", minHeight: 24,
                                            bgcolor: "#EFF6FF", color: "#005DAC", borderRadius: 1, fontWeight: 700, "& .MuiChip-label": { whiteSpace: "normal", py: 0.25 } }} />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>Liều dùng: {item.dosage || "Chưa ghi nhận"}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>Cách dùng: {item.instructions || "Chưa ghi nhận"}</Typography>
                                </Box>)}
                            </Box>
                            {activePrescription.notes && <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #E5E9F0" }}>
                                <Stack direction="row" sx={{ gap: 1.25, alignItems: "center" }}>
                                    <NotesOutlinedIcon sx={{ color: "#005DAC", fontSize: 18, flexShrink: 0 }} />
                                    <Typography component="h4" variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>LỜI DẶN</Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ mt: 0.5, color: "#374151", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>{activePrescription.notes}</Typography>
                            </Box>}
                        </>}
                </Box>
                {!clinicalReady && <Alert severity="warning" sx={{ mx: { xs: 2, sm: 2.5 }, mt: 2 }}>Chưa đủ triệu chứng, chẩn đoán và kết luận để xác nhận cập nhật sổ.</Alert>}
                <Box sx={{ m: { xs: 2, sm: 2.5 }, p: 1.5, border: "1px solid #FDE68A", borderRadius: 1, bgcolor: "#FFFBEB" }}>
                    <FormControlLabel sx={{ m: 0, gap: 1, alignItems: "flex-start", "& .MuiCheckbox-root": { p: 0, mt: 0.25 } }}
                        control={<Checkbox checked={checked} disabled={!canConfirm} onChange={(event) => setChecked(event.target.checked)} />}
                        label={<Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.7 }}>
                            Tôi đã đối chiếu đúng sổ <Box component="span" sx={{ fontWeight: 700 }}>{bookNumber}</Box> của bệnh nhân và ghi đầy đủ nội dung lượt khám cùng đơn thuốc (nếu có) vào sổ giấy.
                        </Typography>} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.5, borderTop: "1px solid #E5E9F0", "& > :not(style) ~ :not(style)": { ml: 0 } }}>
                <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={onClose} disabled={saving}>Quay lại</Button>
                <Button variant="contained" startIcon={<CheckCircleOutlineOutlinedIcon />} disabled={!checked || !canConfirm} onClick={onConfirm}>Xác nhận</Button>
            </DialogActions>
        </Dialog>
    );
}

export default PaperBookConfirmDialog;
