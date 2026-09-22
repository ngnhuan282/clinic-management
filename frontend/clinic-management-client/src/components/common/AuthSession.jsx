import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../../api/axiosClient";
import { sessionVerified } from "../../store/authSlice";
import { getApiErrorMessage } from "../../utils/errorHandler";

export default function AuthSession({ children }) {
    const { sessionChecked, user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (sessionChecked) return;
        const controller = new AbortController();
        axiosClient.get("/auth/me", { signal: controller.signal }).then(({ data }) => {
            if (!controller.signal.aborted) dispatch(sessionVerified(data.result));
        }).catch(err => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
        return () => controller.abort();
    }, [sessionChecked, user?.userId, dispatch, attempt]);
    if (!sessionChecked) return <Box sx={{ p: 4 }}>
        {error ? <Alert severity="error" action={<Button onClick={() => { setError(""); setAttempt(value => value + 1); }}>Thử lại</Button>}>{error}</Alert> : <CircularProgress aria-label="Đang kiểm tra phiên đăng nhập" />}
    </Box>;
    return children;
}
