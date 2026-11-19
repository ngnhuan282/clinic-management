import { useState } from "react";
import { Alert, Box, Button, InputAdornment, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { AssignmentIndRounded, LockOutlined, SaveOutlined, WorkspacePremiumOutlined } from "@mui/icons-material";

import { getMyDoctorProfile, updateMyDoctorProfile } from "../../../api/doctorApi";
import { useMyProfile } from "../../../hooks/useMyProfile";
import AccountProfile from "../../../components/common/AccountProfile";
import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import { clinicColors, clinicFieldSx, clinicPrimaryButtonSx, clinicSurfaceSx } from "../../../components/common/clinicUi";

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

const lockedAdornment = {
    input: { endAdornment: <InputAdornment position="end"><LockOutlined sx={{ fontSize: 18, color: "#94A3B8" }} /></InputAdornment> },
};

function DoctorProfileForm({ profile, saving, error, onSave }) {
    const [form, setForm] = useState(() => toForm(profile));
    const [saved, setSaved] = useState(false);

    const handleSubmit = async event => {
        event.preventDefault();
        setSaved(false);
        if (await onSave(toPayload(form))) setSaved(true);
    };

    const update = field => event => {
        setSaved(false);
        setForm({ ...form, [field]: event.target.value });
    };

    return (
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" aria-busy={saving}
            sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3.5 }, borderRadius: "16px" }}>
            <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: "#E6F0FA", color: clinicColors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <WorkspacePremiumOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography component="h2" sx={{ fontSize: 18.5, fontWeight: 800, color: clinicColors.heading }}>Thông tin chuyên môn</Typography>
                        <Typography sx={{ mt: 0.4, fontSize: 14, color: clinicColors.muted, lineHeight: 1.6 }}>
                            Nội dung này hiển thị với bệnh nhân khi họ tra cứu bác sĩ và đặt lịch khám.
                        </Typography>
                    </Box>
                </Stack>

                {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
                {saved && <Alert severity="success" sx={{ borderRadius: "10px" }}>Đã lưu hồ sơ bác sĩ thành công.</Alert>}

                <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                    <TextField disabled fullWidth label="Khoa" value={profile.departmentName ?? ""} slotProps={lockedAdornment} sx={clinicFieldSx}
                        helperText="Do quản trị viên phân công" />
                    <TextField disabled fullWidth label="Chuyên môn" value={profile.specializationName ?? ""} slotProps={lockedAdornment} sx={clinicFieldSx}
                        helperText="Do quản trị viên phân công" />
                    <TextField required fullWidth label="Họ và tên" value={form.fullName} onChange={update("fullName")} disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ ...clinicFieldSx, gridColumn: { sm: "1 / -1" } }} />
                    <TextField required fullWidth label="Học hàm / học vị" value={form.title} onChange={update("title")} disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 50 } }} helperText="Ví dụ: BS.CKII, ThS.BS" sx={clinicFieldSx} />
                    <TextField required fullWidth type="number" label="Số năm kinh nghiệm" value={form.experienceYears} onChange={update("experienceYears")} disabled={saving}
                        slotProps={{ htmlInput: { min: 0, max: 70 } }} helperText="Từ 0 đến 70 năm" sx={clinicFieldSx} />
                    <TextField fullWidth multiline minRows={4} label="Giới thiệu" value={form.biography} onChange={update("biography")} disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 500 } }} helperText={`${form.biography.length}/500 ký tự`}
                        sx={{ ...clinicFieldSx, gridColumn: { sm: "1 / -1" } }} />
                </Box>

                <Box sx={{ borderTop: "1px solid #E2ECF5", pt: 2.5, display: "flex", justifyContent: "flex-end" }}>
                    <Button type="submit" variant="contained" disabled={saving} startIcon={<SaveOutlined />}
                        sx={{ ...clinicPrimaryButtonSx, px: 3, fontWeight: 750, width: { xs: "100%", sm: "auto" } }}>
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
        <Stack spacing={3} sx={{ maxWidth: 960, mx: "auto", p: { xs: 2, md: 4 }, pb: 5, minWidth: 0 }}>
            <ClinicPageHeader
                icon={AssignmentIndRounded}
                eyebrow="Cá nhân"
                title="Hồ sơ bác sĩ"
                description="Cập nhật thông tin tài khoản và thông tin chuyên môn hiển thị với bệnh nhân khi tra cứu bác sĩ."
            />

            <AccountProfile />

            {status === "loading" && <Skeleton variant="rounded" height={420} sx={{ borderRadius: "16px" }} />}
            {status === "error" && <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>}

            {status === "ready" && (
                <DoctorProfileForm
                    key={profile.doctorId}
                    profile={profile}
                    saving={saving}
                    error={error}
                    onSave={submit}
                />
            )}
        </Stack>
    );
}
