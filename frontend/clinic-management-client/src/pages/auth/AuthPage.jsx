import { useState } from "react";
import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axiosClient from "../../api/axiosClient";
import { setCredentials } from "../../store/authSlice";
import getApiErrorMessage from "../../utils/errorHandler";

export default function AuthPage({ register = false }) {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        const data = Object.fromEntries(new FormData(event.currentTarget));
        if (!data.email) delete data.email;
        try {
            const response = await axiosClient.post(`/auth/${register ? "register" : "login"}`, data);
            const { accessToken, refreshToken, ...user } = response.data.result;
            dispatch(setCredentials({ accessToken, refreshToken, user }));
            navigate(location.state?.from?.pathname || (user.role === "Patient" ? "/booking" : "/internal/dashboard"), { replace: true });
        } catch (err) { setError(getApiErrorMessage(err)); }
        finally { setBusy(false); }
    }
    return <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ p: 4 }}>
            <Stack component="form" onSubmit={submit} spacing={2}>
                <Typography variant="h5">{register ? "Đăng ký bệnh nhân" : "Đăng nhập"}</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Tên đăng nhập" name="username" required autoComplete="username" slotProps={{ htmlInput: { maxLength: 50 } }} />
                {register && <TextField label="Họ và tên" name="fullName" required slotProps={{ htmlInput: { maxLength: 100 } }} />}
                {register && <TextField label="Email" name="email" type="email" autoComplete="email" />}
                <TextField label="Mật khẩu" name="password" required type="password" autoComplete={register ? "new-password" : "current-password"} slotProps={{ htmlInput: { minLength: register ? 8 : 1, maxLength: 72 } }} />
                <Button variant="contained" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : register ? "Đăng ký" : "Đăng nhập"}</Button>
                <Box><Link component={RouterLink} to={register ? "/login" : "/register"}>{register ? "Đã có tài khoản? Đăng nhập" : "Đăng ký tài khoản bệnh nhân"}</Link></Box>
            </Stack>
        </Paper>
    </Container>;
}
