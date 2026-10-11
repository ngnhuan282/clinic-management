import { useState } from "react";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";
import { clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx } from "../../components/common/clinicUi";

export default function LabTestTypeModal({ isOpen, onClose, onSubmit, initialData, saving, error }) {
    const [formData, setFormData] = useState(initialData || { name: "", description: "", price: 0, isActive: true });
    const update = field => event => setFormData(current => ({ ...current, [field]: event.target.value }));
    const submit = event => { event.preventDefault(); if (!saving) onSubmit(formData); };
    return <Dialog open={isOpen} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="lab-type-form-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
        <DialogTitle id="lab-type-form-title" sx={clinicDialogTitleSx}>{initialData ? "Cập nhật loại xét nghiệm" : "Thêm loại xét nghiệm mới"}</DialogTitle>
        <Box component="form" onSubmit={submit}>
            <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2.5}>
                <Typography sx={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>Điền thông tin dịch vụ và đơn giá. Các trường có dấu * là bắt buộc.</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField required fullWidth label="Tên xét nghiệm" value={formData.name} onChange={update("name")} disabled={saving} sx={clinicFieldSx} slotProps={{ htmlInput: { maxLength: 200 } }} />
                <TextField required fullWidth type="number" label="Giá dịch vụ (VNĐ)" value={formData.price} onChange={event => setFormData(current => ({ ...current, price: Number(event.target.value) }))} disabled={saving} helperText="Đơn giá áp dụng cho một lượt xét nghiệm." sx={clinicFieldSx} slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }} />
                <TextField fullWidth multiline minRows={3} label="Mô tả" value={formData.description || ""} onChange={update("description")} disabled={saving} sx={clinicFieldSx} slotProps={{ htmlInput: { maxLength: 500 } }} />
                {initialData && <FormControlLabel control={<Checkbox checked={formData.isActive} disabled={saving} onChange={event => setFormData(current => ({ ...current, isActive: event.target.checked }))} />} label="Đang sử dụng" />}
            </Stack></DialogContent>
            <DialogActions sx={clinicDialogActionsSx}><Button disabled={saving} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>Hủy</Button><Button disabled={saving} type="submit" variant="contained" startIcon={<SaveOutlined />} sx={clinicPrimaryButtonSx}>{saving ? "Đang lưu..." : "Lưu thông tin"}</Button></DialogActions>
        </Box>
    </Dialog>;
}
