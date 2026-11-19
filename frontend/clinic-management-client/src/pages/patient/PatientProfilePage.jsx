import { useRef, useState } from "react";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { BadgeOutlined, PersonOutlineOutlined, SaveOutlined } from "@mui/icons-material";
import { createMyPatientProfile, getMyPatientProfile, updateMyPatientProfile } from "../../api/patientApi";
import { useMyProfile } from "../../hooks/useMyProfile";
import AccountProfile, { ProfileLoadingState } from "../../components/common/AccountProfile";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import {
    clinicColors,
    clinicFieldSx,
    clinicPageCanvasSx,
    clinicPrimaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";
import getApiErrorMessage from "../../utils/errorHandler";
import { toPatientProfileForm as toForm, toPatientProfilePayload as toPayload } from "../../utils/patientProfileForm";

function PatientProfileForm({ profile, saving, error, onSave, saved, onEdit, createMode = false }) {
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
                borderRadius: "16px",
            }}
            aria-busy={saving}
        >
            <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "10px",
                            bgcolor: "#E6F0FA",
                            color: clinicColors.primary,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <BadgeOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography component="h2" sx={{ fontSize: 18.5, fontWeight: 800, color: clinicColors.heading }}>
                            Hồ sơ khám bệnh
                        </Typography>
                        <Typography sx={{ mt: 0.4, fontSize: 14, color: clinicColors.muted, lineHeight: 1.6 }}>
                            Thông tin định danh y tế được sử dụng khi bạn đặt lịch khám và làm thủ tục check-in tại quầy lễ tân.
                        </Typography>
                    </Box>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ borderRadius: "10px" }}>
                        {error}
                    </Alert>
                )}
                {saved && (
                    <Alert severity="success" sx={{ borderRadius: "10px" }}>
                        Đã lưu hồ sơ khám bệnh thành công.
                    </Alert>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.25 }}>
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

                <Box sx={{ borderTop: "1px solid #E2ECF5", pt: 2.5, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={<SaveOutlined />}
                        sx={{
                            ...clinicPrimaryButtonSx,
                            px: 3,
                            fontWeight: 750,
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        {saving ? "Đang lưu thông tin..." : createMode ? "Tạo hồ sơ khám bệnh" : "Lưu thay đổi hồ sơ"}
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
    return (
        <PatientProfileForm
            profile={EMPTY_PROFILE}
            saving={creating}
            error={error}
            onSave={create}
            saved={false}
            onEdit={() => setError("")}
            createMode
        />
    );
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
    if (status === "error" && errorStatus === 404 && errorCode === 4001)
        return (
            <Stack spacing={2}>
                <Alert severity="info" sx={{ borderRadius: "12px", bgcolor: "#EAF2FA", border: "1px solid #90BCE6", color: "#0A2540" }}>
                    Bạn chưa có hồ sơ khám bệnh tại phòng khám. Hãy điền thông tin định danh bên dưới để khởi tạo hồ sơ bệnh nhân.
                </Alert>
                <CreateProfileSection onCreated={onRetry} />
                <Box>
                    <Button onClick={onRetry} size="small">
                        Kiểm tra lại hồ sơ
                    </Button>
                </Box>
            </Stack>
        );
    if (status === "error")
        return (
            <Alert severity="error" action={<Button color="inherit" onClick={onRetry}>Thử lại</Button>}>
                {error}
            </Alert>
        );
    return (
        <PatientProfileForm
            key={`${JSON.stringify(profile)}-${saveRevision}`}
            profile={profile}
            saving={saving}
            error={error}
            onSave={save}
            saved={saved}
            onEdit={() => setSaved(false)}
        />
    );
}

export default function PatientProfilePage() {
    const [revision, setRevision] = useState(0);

    return (
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        eyebrow="Quản lý thông tin y tế"
                        title="Hồ sơ cá nhân"
                        icon={PersonOutlineOutlined}
                        description="Đồng bộ thông tin tài khoản đăng nhập và hồ sơ khám chữa bệnh để làm thủ tục nhanh chóng hơn."
                    />
                    <AccountProfile />
                    <PatientProfileSection key={revision} onRetry={() => setRevision(value => value + 1)} />
                </Stack>
            </Container>
        </Box>
    );
}
