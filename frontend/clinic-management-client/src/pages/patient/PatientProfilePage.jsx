import { useRef, useState } from "react";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { PersonOutlineOutlined, SaveOutlined } from "@mui/icons-material";
import { createMyPatientProfile, getMyPatientProfile, updateMyPatientProfile } from "../../api/patientApi";
import { useMyProfile } from "../../hooks/useMyProfile";
import AccountProfile, { ProfileLoadingState } from "../../components/common/AccountProfile";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import { clinicColors, clinicFieldSx, clinicPrimaryButtonSx, clinicSurfaceSx } from "../../components/common/clinicUi";
import getApiErrorMessage from "../../utils/errorHandler";

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

function PatientProfileForm({ profile, saving, error, onSave, saved, onEdit }) {
    const [form, setForm] = useState(() => toForm(profile));
    const pending = useRef(false);

    const update = field => event => {
        setForm(current => ({ ...current, [field]: event.target.value }));
        onEdit();
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (saving || pending.current) return;
        onEdit();
        pending.current = true;
        try {
            await onSave(toPayload(form));
        } finally {
            pending.current = false;
        }
    };

    return (
        <Paper
            component="form"
            onSubmit={handleSubmit}
            variant="outlined"
            sx={{
                ...clinicSurfaceSx,
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "14px",
                borderColor: "#e5e9f0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
            aria-busy={saving}
        >
            <Stack spacing={2.5}>
                <Box>
                    <Typography component="h2" sx={{ fontSize: 18, fontWeight: 750, color: "#0f2c4d" }}>
                        Hồ sơ khám bệnh
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13.5, color: clinicColors.muted, lineHeight: 1.6 }}>
                        Thông tin định danh này được sử dụng tự động khi bạn đặt lịch khám và làm thủ tục check-in tại quầy lễ tân.
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
                {saved && <Alert severity="success" sx={{ borderRadius: "10px" }}>Đã lưu thông tin hồ sơ thành công.</Alert>}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                    <TextField
                        required
                        fullWidth
                        label="Họ và tên"
                        value={form.fullName}
                        onChange={update("fullName")}
                        disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        sx={clinicFieldSx}
                    />
                    <TextField
                        required
                        fullWidth
                        type="tel"
                        label="Số điện thoại"
                        value={form.phone}
                        onChange={update("phone")}
                        disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 15 } }}
                        sx={clinicFieldSx}
                    />
                    <TextField
                        fullWidth
                        type="date"
                        label="Ngày sinh"
                        value={form.birthDate}
                        onChange={update("birthDate")}
                        disabled={saving}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={clinicFieldSx}
                    />
                    <TextField
                        fullWidth
                        label="Số CCCD / CMND"
                        value={form.identityNumber}
                        onChange={update("identityNumber")}
                        disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 20 } }}
                        sx={clinicFieldSx}
                    />
                    <TextField
                        fullWidth
                        label="Mã thẻ Bảo hiểm y tế"
                        value={form.insuranceCode}
                        onChange={update("insuranceCode")}
                        disabled={saving}
                        slotProps={{ htmlInput: { maxLength: 30 } }}
                        sx={clinicFieldSx}
                    />
                </Box>

                <Box sx={{ borderTop: "1px solid #E2E8F0", pt: 2.5, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={<SaveOutlined />}
                        sx={{
                            ...clinicPrimaryButtonSx,
                            borderRadius: "8px",
                            px: 3,
                            fontWeight: 700,
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        {saving ? "Đang lưu thông tin..." : "Lưu thay đổi hồ sơ"}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

const EMPTY_PROFILE = { fullName: "", phone: "", birthDate: null, identityNumber: "", insuranceCode: "" };

function CreateProfileSection({ onCreated }) {
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const create = async payload => {
        setCreating(true);
        setError("");
        try {
            await createMyPatientProfile(payload);
            onCreated();
            return true;
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
            return false;
        } finally {
            setCreating(false);
        }
    };
    return <PatientProfileForm profile={EMPTY_PROFILE} saving={creating} error={error} onSave={create} saved={false} onEdit={() => setError("")} />;
}

function PatientProfileSection({ onRetry }) {
    const { profile, status, error, errorStatus, errorCode, saving, submit } = useMyProfile(
        getMyPatientProfile,
        updateMyPatientProfile
    );
    const [saved, setSaved] = useState(false);
    const [saveRevision, setSaveRevision] = useState(0);

    const save = async payload => {
        if (await submit(payload)) {
            setSaveRevision(value => value + 1);
            setSaved(true);
        }
    };

    if (status === "loading") return <ProfileLoadingState title="Hồ sơ khám bệnh" />;
    if (status === "error" && errorStatus === 404 && errorCode === 4001) return <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 } }}><Stack spacing={2}>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600 }}>Hồ sơ khám bệnh</Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>Bạn chưa có hồ sơ khám bệnh tại phòng khám. Bạn vẫn có thể cập nhật thông tin tài khoản ở trên.</Alert>
        <Typography sx={{ fontSize: 13.5, color: clinicColors.muted, lineHeight: 1.65 }}>Hồ sơ khám bệnh được cập nhật sau khi phòng khám tiếp nhận và xác nhận thông tin của bạn.</Typography>
        <Box><Button onClick={onRetry}>Kiểm tra lại hồ sơ</Button></Box>
    </Stack></Paper>;
    if (status === "error") return <Alert severity="error" action={<Button color="inherit" onClick={onRetry}>Thử lại</Button>}>{error}</Alert>;
    return <PatientProfileForm key={`${JSON.stringify(profile)}-${saveRevision}`} profile={profile} saving={saving} error={error} onSave={save} saved={saved} onEdit={() => setSaved(false)} />;
}

export default function PatientProfilePage() {
    const [revision, setRevision] = useState(0);

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "85vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        title="Hồ sơ cá nhân"
                        icon={PersonOutlineOutlined}
                        description="Quản lý thông tin tài khoản đăng nhập và hồ sơ y tế bệnh nhân của bạn."
                    />
                    <AccountProfile />
                    <PatientProfileSection key={revision} onRetry={() => setRevision(value => value + 1)} />
                </Stack>
            </Container>
        </Box>
    );
}
