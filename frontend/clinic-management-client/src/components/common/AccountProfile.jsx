import { useState } from "react";
import { useDispatch } from "react-redux";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { getMyProfile, updateMyProfile } from "../../api/authApi";
import { useMyProfile } from "../../hooks/useMyProfile";
import { sessionVerified } from "../../store/authSlice";

function ProfileForm({ profile, saving, error, submit }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState({ fullName: profile.fullName, email: profile.email || "", phone: profile.phone || "" });
    const [message, setMessage] = useState("");
    const [validation, setValidation] = useState("");
    const update = field => event => { setForm({ ...form, [field]: event.target.value }); setMessage(""); };
    const save = async event => {
        event.preventDefault();
        setMessage("");
        const payload = { fullName: form.fullName.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null };
        if (!payload.fullName || payload.fullName.length > 100 || form.email.length > 100 || form.phone.length > 15
            || (payload.phone && !/^[+\d\s().-]+$/.test(payload.phone))) {
            setValidation("Kiểm tra họ tên, email và số điện thoại.");
            return;
        }
        setValidation("");
        if (await submit(payload)) {
            dispatch(sessionVerified({ ...profile, ...payload }));
            setMessage("Đã lưu thông tin tài khoản.");
        }
    };
    return <Paper component="form" variant="outlined" onSubmit={save} sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2.5}>
            <Typography variant="h6">Thông tin tài khoản</Typography>
            {(error || validation) && <Alert severity="error">{validation || error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
            <TextField label="Tên đăng nhập" value={profile.username} disabled />
            <TextField label="Họ tên tài khoản" required value={form.fullName} onChange={update("fullName")} disabled={saving} slotProps={{ htmlInput: { maxLength: 100 } }} />
            <TextField label="Email" type="email" value={form.email} onChange={update("email")} disabled={saving} slotProps={{ htmlInput: { maxLength: 100 } }} />
            <TextField label="Điện thoại tài khoản" type="tel" value={form.phone} onChange={update("phone")} disabled={saving} slotProps={{ htmlInput: { maxLength: 15 } }} />
            <Box><Button variant="contained" type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu tài khoản"}</Button></Box>
        </Stack>
    </Paper>;
}

export default function AccountProfile() {
    const { profile, status, saving, error, submit } = useMyProfile(getMyProfile, updateMyProfile);
    if (status === "loading") return <CircularProgress aria-label="Đang tải hồ sơ tài khoản" />;
    if (status === "error") return <Alert severity="error">{error}</Alert>;
    return <ProfileForm key={profile.userId} profile={profile} saving={saving} error={error} submit={submit} />;
}
