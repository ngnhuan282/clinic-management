import { useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { CloseOutlined, SaveOutlined } from "@mui/icons-material";
import { clinicColors, clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx } from "../../common/clinicUi";

const emptyForm = { diseaseCode: "", diseaseName: "", description: "", isActive: true };
const getInitialForm = disease => disease ? { diseaseCode: disease.diseaseCode || "", diseaseName: disease.diseaseName || "", description: disease.description || "", isActive: Boolean(disease.isActive) } : emptyForm;

export default function DiseaseFormDialog({ open, disease, saving, onClose, onSubmit }) {
    const [form, setForm] = useState(() => getInitialForm(disease));
    const [error, setError] = useState("");
    const submitting = useRef(false);
    const isEditing = Boolean(disease);
    const handleChange = field => event => setForm(current => ({ ...current, [field]: event.target.value }));
    const handleSubmit = async event => {
        event.preventDefault();
        if (saving || submitting.current) return;
        setError("");
        if (!form.diseaseCode.trim()) { setError("Vui lòng nhập mã bệnh."); return; }
        if (!form.diseaseName.trim()) { setError("Vui lòng nhập tên bệnh."); return; }
        const payload = { diseaseCode: form.diseaseCode.trim(), diseaseName: form.diseaseName.trim(), description: form.description.trim() || null };
        if (isEditing) payload.isActive = form.isActive;
        submitting.current = true;
        try { await onSubmit(payload, disease?.diseaseId || null); onClose(); }
        catch (requestError) { setError(requestError.message); }
        finally { submitting.current = false; }
    };

    return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="disease-form-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
        <DialogTitle id="disease-form-title" sx={clinicDialogTitleSx}><Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}><span>{isEditing ? "Cập nhật bệnh" : "Thêm bệnh mới"}</span><Tooltip title="Đóng biểu mẫu"><span><IconButton size="small" aria-label="Đóng biểu mẫu bệnh" onClick={onClose} disabled={saving} sx={{ color: clinicColors.muted }}><CloseOutlined /></IconButton></span></Tooltip></Stack></DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2.5}>
            <Typography sx={{ fontSize: 14, color: clinicColors.muted, lineHeight: 1.65 }}>Thông tin bệnh được sử dụng trong danh sách chẩn đoán của hồ sơ bệnh án. Các trường có dấu * là bắt buộc.</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Box component="form" id="disease-form" onSubmit={handleSubmit}><Stack spacing={2.5}>
                <TextField label="Mã bệnh" value={form.diseaseCode} onChange={handleChange("diseaseCode")} fullWidth required disabled={saving} placeholder="VD: I10, E11, J06" slotProps={{ htmlInput: { maxLength: 32 } }} sx={clinicFieldSx} />
                <TextField label="Tên bệnh" value={form.diseaseName} onChange={handleChange("diseaseName")} fullWidth required disabled={saving} placeholder="VD: Tăng huyết áp" slotProps={{ htmlInput: { maxLength: 160 } }} sx={clinicFieldSx} />
                <TextField label="Mô tả / ghi chú" value={form.description} onChange={handleChange("description")} fullWidth multiline minRows={3} disabled={saving} slotProps={{ htmlInput: { maxLength: 500 } }} helperText={`${form.description.length}/500 ký tự`} sx={clinicFieldSx} />
                {isEditing && <FormControlLabel control={<Switch checked={form.isActive} disabled={saving} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} />} label={form.isActive ? "Đang áp dụng" : "Tạm ngưng"} sx={{ m: 0, color: clinicColors.heading }} />}
            </Stack></Box>
        </Stack></DialogContent>
        <DialogActions sx={clinicDialogActionsSx}><Button onClick={onClose} disabled={saving} variant="outlined" sx={clinicSecondaryButtonSx}>Hủy</Button><Button type="submit" form="disease-form" variant="contained" startIcon={<SaveOutlined />} disabled={saving} sx={clinicPrimaryButtonSx}>{saving ? "Đang lưu..." : "Lưu bệnh"}</Button></DialogActions>
    </Dialog>;
}
