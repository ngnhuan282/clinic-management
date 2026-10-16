import { useState } from "react";
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PrescriptionEditorToolbar from "./PrescriptionEditorToolbar";
import PrescriptionMedicineTable from "./PrescriptionMedicineTable";
import ConfirmDialog from "../../common/ConfirmDialog";
import { validateStockReviewDecision } from "../../../utils/stockReviewDecision";

export default function StockReviewResponseForm({ detail, options, busy, onSubmit }) {
    const [form, setForm] = useState(() => ({ action: "KeepPrescription", reason: "", notes: detail.prescription.notes || "",
        details: detail.prescription.details.map(item => ({ ...item, localId: String(item.medicineId) })) }));
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const adjust = form.action === "AdjustPrescription";
    const proposal = adjust && detail.hasMedicineInvoice;
    const latestDecision = detail.review.decisions?.[0];
    const summaries = form.details.map(item => {
        const medicine = options.find(x => x.medicineId === item.medicineId) || detail.prescription.details.find(x => x.medicineId === item.medicineId);
        const availableQuantity = medicine?.availableQuantity || 0;
        return { ...item, medicine, availableQuantity, stockStatus: availableQuantity <= 0 ? "OutOfStock" : availableQuantity < Number(item.quantity) ? "Insufficient" : "Available" };
    });
    const change = (field, value) => { setError(""); setForm(previous => ({ ...previous, [field]: value })); };
    function updateDetail(localId, field, value) { change("details", form.details.map(item => item.localId === localId ? { ...item, [field]: value } : item)); }
    function addMedicine(medicine) {
        if (!medicine || form.details.some(item => item.medicineId === medicine.medicineId)) return false;
        change("details", [...form.details, { localId: String(medicine.medicineId), medicineId: medicine.medicineId, quantity: 1, dosage: "", instructions: "" }]);
        return true;
    }
    function prepare(event) {
        event.preventDefault();
        const validation = validateStockReviewDecision(form, detail.prescription, latestDecision);
        setError(validation);
        if (!validation) setConfirmOpen(true);
    }
    async function send() {
        try {
            await onSubmit({ action: form.action, reason: form.reason.trim(), notes: form.notes.trim() || null,
                details: adjust ? form.details.map(item => ({ medicineId: item.medicineId, quantity: Number(item.quantity), dosage: item.dosage.trim(), instructions: item.instructions.trim() })) : [],
                expectedReviewUpdatedAt: detail.review.updatedAt, expectedPrescriptionUpdatedAt: detail.prescriptionUpdatedAt });
            setConfirmOpen(false);
        } catch (failure) { setConfirmOpen(false); setError(failure.message); }
    }
    return <Box component="form" aria-label="Phản hồi của bác sĩ" onSubmit={prepare} sx={{ minWidth: 0,
        p: { xs: 2, sm: 2.5 }, bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: 2,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        "& .MuiInputBase-root": { bgcolor: "#FFFFFF", fontSize: 16 },
        "& .MuiFormHelperText-root": { fontSize: 14, overflowWrap: "anywhere" },
        "& textarea": { overflowWrap: "anywhere" } }}>
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ pb: 2, borderBottom: "1px solid #E5E9F0", alignItems: "center" }}><FactCheckOutlinedIcon color="primary" fontSize="small" /><Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>Phản hồi của bác sĩ</Typography></Stack>
            <TextField select label="Phương án xử lý" value={form.action} disabled={busy} onChange={event => change("action", event.target.value)} sx={{ maxWidth: 360, width: "100%" }}>
                <MenuItem value="KeepPrescription">Giữ nguyên đơn</MenuItem><MenuItem value="AdjustPrescription">Điều chỉnh đơn thuốc</MenuItem>
            </TextField>
            {proposal && <Alert severity="warning">Đơn đã có hóa đơn. Phương án được lưu để bộ phận thu phí đối soát; chưa thay đổi đơn hoặc số tiền đã thu.</Alert>}
            {adjust && <>
                <PrescriptionEditorToolbar embedded medicineOptions={options} selectedMedicineIds={form.details.map(x => x.medicineId)} onAddMedicine={addMedicine} disabled={busy} />
                <PrescriptionMedicineTable embedded details={summaries} onUpdateDetail={updateDetail} onRemoveDetail={id => change("details", form.details.filter(x => x.localId !== id))} disabled={busy} />
                <TextField label="Lời dặn bác sĩ" multiline minRows={3} maxRows={8} fullWidth value={form.notes} disabled={busy} onChange={event => change("notes", event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 1000 } }} helperText={`${form.notes.length}/1000 ký tự`} />
            </>}
            <TextField label="Lý do xử lý" required multiline minRows={3} maxRows={8} fullWidth value={form.reason} disabled={busy} onChange={event => change("reason", event.target.value)}
                slotProps={{ htmlInput: { maxLength: 2000 } }} helperText={`${form.reason.length}/2000 ký tự`} />
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
            <Stack component="footer" direction="row" sx={{ pt: 2, borderTop: "1px solid #E5E9F0", justifyContent: "flex-end" }}>
                <Button type="submit" variant="contained" startIcon={<SendOutlinedIcon />} disabled={busy || Boolean(latestDecision) || form.reason.trim().length < 3} sx={{ minHeight: 42, maxWidth: "100%", whiteSpace: "normal", fontSize: 15 }}>{busy ? "Đang lưu..." : proposal ? "Gửi phương án điều chỉnh" : adjust ? "Lưu điều chỉnh và phản hồi" : "Gửi phản hồi"}</Button>
            </Stack>
        </Stack>
        <ConfirmDialog open={confirmOpen} title={proposal ? "Gửi phương án điều chỉnh?" : adjust ? "Xác nhận điều chỉnh đơn?" : "Gửi phản hồi giữ nguyên đơn?"}
            message={proposal ? "Phương án và lý do sẽ được lưu vào nhật ký và gửi tới dược sĩ, thu phí. Đơn và hóa đơn hiện tại chưa thay đổi."
                : adjust ? "Đơn thuốc sẽ được cập nhật và lưu vết thay đổi. Cần cập nhật lại sổ giấy; dược sĩ tiếp tục kiểm tra tồn và thanh toán trước khi giao."
                : "Đơn không thay đổi. Dược sĩ cần kiểm tra lại tồn trước khi đóng yêu cầu; không tự động giao thuốc."}
            confirmText="Xác nhận" cancelText="Quay lại" confirmColor="primary"
            loading={busy} onCancel={() => setConfirmOpen(false)} onConfirm={send} />
    </Box>;
}
