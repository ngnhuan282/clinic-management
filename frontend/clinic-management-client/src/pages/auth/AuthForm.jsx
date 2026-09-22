import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, Link, Stack, TextField, Typography } from "@mui/material";
import { ArrowForward, BadgeOutlined, LockOutlined, MailOutlined, PersonOutlined, PhoneOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as authApi from "../../api/authApi";
import { setCredentials } from "../../store/authSlice";
import getApiErrorMessage from "../../utils/errorHandler";
import { canAccessPath, homeForRole } from "../../routes/roleAccess";

function AuthField({ name, label, icon: Icon, error, password = false, ...props }) {
    const [visible, setVisible] = useState(false);
    return <Box sx={{ minWidth: 0 }}>
        <Typography component="label" htmlFor={`auth-${name}`} sx={{ display: "block", mb: 0.9, fontSize: 14, fontWeight: 600, color: "#374151" }}>
            {label} <Box component="span" sx={{ color: "error.main" }} aria-hidden="true">*</Box>
        </Typography>
        <TextField {...props} id={`auth-${name}`} name={name} required fullWidth
            type={password ? (visible ? "text" : "password") : props.type || "text"}
            error={Boolean(error)} helperText={error}
            slotProps={{
                htmlInput: { ...props.slotProps?.htmlInput, "aria-label": label },
                input: {
                    startAdornment: <InputAdornment position="start"><Icon sx={{ color: "#8490a0", fontSize: 21 }} /></InputAdornment>,
                    endAdornment: password ? <InputAdornment position="end"><IconButton size="small" aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)} edge="end">
                        {visible ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                    </IconButton></InputAdornment> : undefined,
                },
            }}
            sx={{ "& .MuiOutlinedInput-root": { minHeight: 50 }, "& input": { py: 1.5, fontSize: 14 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#dfe5ed" } }} />
    </Box>;
}

function validate(values, register, confirmed) {
    const errors = {};
    if (!values.username.trim()) errors.username = "Vui lòng nhập tên đăng nhập.";
    if (!values.password) errors.password = "Vui lòng nhập mật khẩu.";
    if (register) {
        if (!values.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
        if (!/^\+?[\d\s().-]{8,15}$/.test(values.phone.trim()) || !/\d{3}/.test(values.phone)) errors.phone = "Vui lòng nhập số điện thoại hợp lệ (8–15 ký tự).";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
        if (values.password.length < 8) errors.password = "Mật khẩu cần ít nhất 8 ký tự.";
        if (values.confirmPassword !== values.password || !values.confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
        if (!confirmed) errors.confirmed = "Vui lòng xác nhận thông tin đăng ký.";
    }
    if (new TextEncoder().encode(values.password).length > 72) errors.password = "Mật khẩu quá dài. Vui lòng sử dụng mật khẩu ngắn hơn.";
    return errors;
}

export default function AuthForm({ register }) {
    const request = useRef(null);
    useEffect(() => {
        const activeRequest = request;
        return () => activeRequest.current?.abort();
    }, []);
    const [values, setValues] = useState({ username: "", fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [remember, setRemember] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const fieldProps = name => ({ value: values[name], error: errors[name], disabled: busy, onChange: event => {
        setValues(current => ({ ...current, [name]: event.target.value }));
        setErrors(current => ({ ...current, [name]: undefined }));
        setError("");
    } });

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        setError("");
        const validation = validate(values, register, confirmed);
        setErrors(validation);
        if (Object.keys(validation).length) {
            document.getElementById(`auth-${Object.keys(validation)[0]}`)?.focus();
            return;
        }
        setBusy(true);
        request.current = new AbortController();
        const signal = request.current.signal;
        const payload = { username: values.username.trim(), password: values.password };
        if (register) Object.assign(payload, { fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() });
        try {
            const { accessToken, refreshToken, ...user } = await (register ? authApi.register(payload, signal) : authApi.login(payload, signal));
            if (signal.aborted) return;
            dispatch(setCredentials({ accessToken, refreshToken, user, remember: !register && remember }));
            const from = location.state?.from;
            const fallback = homeForRole(user.role);
            const destination = from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")
                && canAccessPath(user.role, from.pathname)
                ? `${from.pathname}${from.search || ""}${from.hash || ""}` : fallback;
            navigate(destination, { replace: true });
        } catch (err) {
            if (signal.aborted) return;
            const apiErrors = err.response?.data?.errors;
            if (apiErrors && !Array.isArray(apiErrors)) {
                setErrors(Object.fromEntries(Object.entries(apiErrors).map(([key, messages]) => [key[0].toLowerCase() + key.slice(1), [].concat(messages).join(" ")])));
                setError("Vui lòng kiểm tra lại thông tin đã nhập.");
            } else setError(getApiErrorMessage(err));
        } finally { setBusy(false); }
    }

    return <>
        <Box component="form" noValidate onSubmit={submit} aria-busy={busy}>
            <Stack spacing={2.5}>
                {error && <Alert severity="error">{error}</Alert>}
                <Box sx={{ display: "grid", gridTemplateColumns: register ? { xs: "1fr", sm: "1fr 1fr" } : "1fr", gap: 2.5 }}>
                    <AuthField name="username" label="Tên đăng nhập" icon={PersonOutlined} placeholder="Nhập tên đăng nhập của bạn" autoComplete="username" slotProps={{ htmlInput: { maxLength: 50 } }} {...fieldProps("username")} />
                    {register && <AuthField name="fullName" label="Họ và tên" icon={BadgeOutlined} placeholder="Nguyễn Văn An" autoComplete="name" slotProps={{ htmlInput: { maxLength: 100 } }} {...fieldProps("fullName")} />}
                    {register && <AuthField name="phone" label="Số điện thoại di động" icon={PhoneOutlined} type="tel" placeholder="Ví dụ: 0912345678" autoComplete="tel" slotProps={{ htmlInput: { maxLength: 15 } }} {...fieldProps("phone")} />}
                    {register && <AuthField name="email" label="Địa chỉ email" icon={MailOutlined} type="email" placeholder="Ví dụ: ban@email.com" autoComplete="email" slotProps={{ htmlInput: { maxLength: 100 } }} {...fieldProps("email")} />}
                    <AuthField name="password" label="Mật khẩu" icon={LockOutlined} password placeholder={register ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu của bạn"} autoComplete={register ? "new-password" : "current-password"} slotProps={{ htmlInput: { maxLength: 72 } }} {...fieldProps("password")} />
                    {register && <AuthField name="confirmPassword" label="Xác nhận mật khẩu" icon={LockOutlined} password placeholder="Nhập lại mật khẩu vừa tạo" autoComplete="new-password" slotProps={{ htmlInput: { maxLength: 72 } }} {...fieldProps("confirmPassword")} />}
                </Box>
                {register ? <Box>
                    <FormControlLabel sx={{ alignItems: "flex-start", m: 0, "& .MuiCheckbox-root": { p: 0, mr: 1.25, mt: 0.15 } }} control={<Checkbox id="auth-confirmed" checked={confirmed} disabled={busy} onChange={e => { setConfirmed(e.target.checked); setErrors(current => ({ ...current, confirmed: undefined })); }} size="small" />} label={<Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>Tôi xác nhận thông tin đăng ký ở trên là chính xác.</Typography>} />
                    {errors.confirmed && <Typography role="alert" sx={{ mt: 0.75, fontSize: 12 }} color="error">{errors.confirmed}</Typography>}
                </Box> : <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
                    <FormControlLabel sx={{ m: 0, "& .MuiCheckbox-root": { p: 0, mr: 1 } }} control={<Checkbox checked={remember} disabled={busy} onChange={e => setRemember(e.target.checked)} size="small" />} label={<Typography sx={{ fontSize: 13 }}>Ghi nhớ đăng nhập trên thiết bị này</Typography>} />
                    <Link component="button" type="button" onClick={() => setHelpOpen(true)} sx={{ fontSize: 13, fontWeight: 600 }}>Quên mật khẩu?</Link>
                </Stack>}
                <Button variant="contained" type="submit" disabled={busy} fullWidth endIcon={busy ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />} sx={{ minHeight: 56, fontSize: 16, fontWeight: 700, bgcolor: register ? "#1976d2" : "#0064b4", boxShadow: "0 2px 4px rgba(0,93,172,.15)" }}>
                    {busy ? "Đang xử lý…" : register ? "Đăng ký tài khoản" : "Đăng nhập"}
                </Button>
            </Stack>
        </Box>
        <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="xs" fullWidth aria-labelledby="auth-help-title">
            <DialogTitle id="auth-help-title">Hỗ trợ đăng nhập</DialogTitle>
            <DialogContent><Typography variant="body2" sx={{ lineHeight: 1.8 }}>Nếu bạn quên mật khẩu, vui lòng liên hệ quầy tiếp nhận của phòng khám để được hỗ trợ xác minh tài khoản. Chuẩn bị tên đăng nhập và thông tin liên hệ đã đăng ký.</Typography></DialogContent>
            <DialogActions><Button onClick={() => setHelpOpen(false)}>Đã hiểu</Button></DialogActions>
        </Dialog>
    </>;
}
