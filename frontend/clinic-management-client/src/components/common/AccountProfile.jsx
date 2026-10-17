import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Alert, Box, Button, LinearProgress, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";
import { getMyProfile, updateMyProfile } from "../../api/authApi";
import { useMyProfile } from "../../hooks/useMyProfile";
import { sessionVerified } from "../../store/authSlice";
import { clinicColors, clinicFieldSx, clinicPrimaryButtonSx, clinicSurfaceSx } from "./clinicUi";

export function ProfileLoadingState({ title }) {
    return <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy="true">
        <LinearProgress aria-label="Đang tải hồ sơ" />
        <Stack spacing={2.5} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600 }}>{title}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" height={56} />)}
            </Box>
        </Stack>
    </Paper>;
}

function ProfileForm({ profile, saving, error, submit, message, onEdit, onSaved }) {
    const [form, setForm] = useState({ fullName: profile.fullName, email: profile.email || "", phone: profile.phone || "" });
    const [validation, setValidation] = useState("");
    const pending = useRef(false);
    const update = field => event => { setForm(current => ({ ...current, [field]: event.target.value })); setValidation(""); onEdit(); };
    const save = async event => {
        event.preventDefault();
        if (saving || pending.current) return;
        onEdit();
        const payload = { fullName: form.fullName.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null };
        if (!payload.fullName || payload.fullName.length > 100 || form.email.length > 100 || form.phone.length > 15
            || (payload.phone && !/^[+\d\s().-]+$/.test(payload.phone))) {
            setValidation("Kiểm tra họ tên, email và số điện thoại.");
            return;
        }
        setValidation("");
        pending.current = true;
        try { if (await submit(payload)) onSaved(); }
        finally { pending.current = false; }
    };

    return <Paper component="form" variant="outlined" onSubmit={save} sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 } }} aria-busy={saving}>
        <Stack spacing={2.5}>
            <Box><Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: clinicColors.heading }}>Thông tin tài khoản</Typography><Typography sx={{ mt: 0.75, fontSize: 13.5, color: clinicColors.muted, lineHeight: 1.65 }}>Cập nhật họ tên và thông tin liên hệ của tài khoản đang đăng nhập.</Typography></Box>
            {(error || validation) && <Alert severity="error" sx={{ borderRadius: 2 }}>{validation || error}</Alert>}
            {message && <Alert severity="success" sx={{ borderRadius: 2 }}>{message}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                <TextField label="Tên đăng nhập" value={profile.username} disabled helperText="Tên đăng nhập được giữ cố định." sx={clinicFieldSx} />
                <TextField label="Họ tên tài khoản" required value={form.fullName} onChange={update("fullName")} disabled={saving} slotProps={{ htmlInput: { maxLength: 100 } }} sx={clinicFieldSx} />
                <TextField label="Email" type="email" value={form.email} onChange={update("email")} disabled={saving} slotProps={{ htmlInput: { maxLength: 100 } }} sx={clinicFieldSx} />
                <TextField label="Điện thoại tài khoản" type="tel" value={form.phone} onChange={update("phone")} disabled={saving} slotProps={{ htmlInput: { maxLength: 15 } }} sx={clinicFieldSx} />
            </Box>
            <Box sx={{ borderTop: "1px solid #E2E8F0", pt: 2.5, display: "flex", justifyContent: "flex-end" }}><Button variant="contained" type="submit" disabled={saving} startIcon={<SaveOutlined />} sx={{ ...clinicPrimaryButtonSx, width: { xs: "100%", sm: "auto" } }}>{saving ? "Đang lưu..." : "Lưu tài khoản"}</Button></Box>
        </Stack>
    </Paper>;
}

function AccountProfileContent({ onRetry }) {
    const dispatch = useDispatch();
    const { profile, status, saving, error, submit } = useMyProfile(getMyProfile, updateMyProfile);
    const [message, setMessage] = useState("");
    const [saveRevision, setSaveRevision] = useState(0);
    useEffect(() => { if (profile) dispatch(sessionVerified(profile)); }, [profile, dispatch]);

    if (status === "loading") return <ProfileLoadingState title="Thông tin tài khoản" />;
    if (status === "error") return <Alert severity="error" action={<Button color="inherit" onClick={onRetry}>Thử lại</Button>}>{error}</Alert>;
    return <ProfileForm key={`${JSON.stringify(profile)}-${saveRevision}`} profile={profile} saving={saving} error={error} submit={submit} message={message}
        onEdit={() => setMessage("")} onSaved={() => { setSaveRevision(value => value + 1); setMessage("Đã lưu thông tin tài khoản."); }} />;
}

export default function AccountProfile() {
    const [revision, setRevision] = useState(0);
    return <AccountProfileContent key={revision} onRetry={() => setRevision(value => value + 1)} />;
}
