import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";

import { getMyDoctorProfile, updateMyDoctorProfile } from "../../../api/doctorApi";
import { useMyProfile } from "../../../hooks/useMyProfile";

const toForm = profile => ({
    fullName: profile.fullName ?? "",
    title: profile.title ?? "",
    experienceYears: String(profile.experienceYears ?? 0),
    biography: profile.biography ?? "",
});

const toPayload = form => ({
    fullName: form.fullName.trim(),
    title: form.title.trim(),
    experienceYears: Number(form.experienceYears),
    biography: form.biography.trim() || null,
});

function DoctorProfileForm({ profile, saving, error, onSave }) {
    const [form, setForm] = useState(() => toForm(profile));
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
                <TextField disabled label="Khoa" value={profile.departmentName} />
                <TextField disabled label="Chuyên môn" value={profile.specializationName} />
                <TextField required label="Họ và tên" value={form.fullName} onChange={update("fullName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField required label="Học hàm / học vị" value={form.title} onChange={update("title")} slotProps={{ htmlInput: { maxLength: 50 } }} helperText="Ví dụ: BS.CKII" />
                <TextField required type="number" label="Số năm kinh nghiệm" value={form.experienceYears} onChange={update("experienceYears")} slotProps={{ htmlInput: { min: 0, max: 70 } }} />
                <TextField label="Giới thiệu" value={form.biography} onChange={update("biography")} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} />
                <Box>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

export default function DoctorProfilePage() {
    const { profile, status, error, saving, submit } = useMyProfile(getMyDoctorProfile, updateMyDoctorProfile);

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", p: { xs: 2, md: 4 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Hồ sơ bác sĩ</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Cập nhật thông tin hiển thị với bệnh nhân khi tra cứu bác sĩ.
            </Typography>

            {status === "loading" && <CircularProgress />}
            {status === "error" && <Alert severity="error">{error}</Alert>}

            {status === "ready" && (
                <DoctorProfileForm
                    key={profile.doctorId}
                    profile={profile}
                    saving={saving}
                    error={error}
                    onSave={submit}
                />
            )}
        </Box>
    );
}
