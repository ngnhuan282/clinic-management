import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";

import { getMyPatientProfile, updateMyPatientProfile } from "../../api/patientApi";
import { useMyProfile } from "../../hooks/useMyProfile";

const toForm = profile => ({
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
    identityNumber: profile.identityNumber ?? "",
    insuranceCode: profile.insuranceCode ?? "",
});

const toPayload = form => ({
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    birthDate: form.birthDate || null,
    identityNumber: form.identityNumber.trim() || null,
    insuranceCode: form.insuranceCode.trim() || null,
});

function PatientProfileForm({ initialProfile, saving, error, onSave }) {
    const [form, setForm] = useState(() => toForm(initialProfile));
    const [saved, setSaved] = useState(false);

    const handleSubmit = async event => {
        event.preventDefault();
        setSaved(false);
        if (await onSave(toPayload(form))) setSaved(true);
    };

    const update = field => event => setForm({ ...form, [field]: event.target.value });

    return (
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
                {error && <Alert severity="error">{error}</Alert>}
                {saved && <Alert severity="success">Đã lưu hồ sơ.</Alert>}
                <TextField required label="Họ và tên" value={form.fullName} onChange={update("fullName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField required label="Số điện thoại" value={form.phone} onChange={update("phone")} slotProps={{ htmlInput: { maxLength: 15 } }} />
                <TextField type="date" label="Ngày sinh" value={form.birthDate} onChange={update("birthDate")} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Số CCCD" value={form.identityNumber} onChange={update("identityNumber")} slotProps={{ htmlInput: { maxLength: 20 } }} />
                <TextField label="Mã bảo hiểm y tế" value={form.insuranceCode} onChange={update("insuranceCode")} slotProps={{ htmlInput: { maxLength: 30 } }} />
                <Box>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

export default function PatientProfilePage() {
    const { profile, status, error, saving, submit } = useMyProfile(getMyPatientProfile, updateMyPatientProfile);

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Hồ sơ cá nhân</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Thông tin này được dùng khi đặt lịch và check-in tại quầy lễ tân.
            </Typography>

            {status === "loading" && <CircularProgress />}
            {status === "error" && <Alert severity="error">{error}</Alert>}

            {status === "ready" && (
                <PatientProfileForm
                    key={profile.patientId}
                    initialProfile={profile}
                    saving={saving}
                    error={error}
                    onSave={submit}
                />
            )}
        </Box>
    );
}
