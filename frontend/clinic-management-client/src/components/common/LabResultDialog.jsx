import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import useNotifications from "../../hooks/useNotifications";
import labTestApi from "../../api/labTestApi";
import getApiErrorMessage from "../../utils/errorHandler";

export default function LabResultDialog({ id, onClose }) {
    const { userId } = useAuth();
    const { labResultsRevision } = useNotifications();
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);
    const key = JSON.stringify([id, userId, labResultsRevision, revision]);
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        labTestApi.getDetail(id, { signal: controller.signal })
            .then(response => !controller.signal.aborted && setResult({ key, data: response.data }))
            .catch(error => !controller.signal.aborted && setResult({ key, error: getApiErrorMessage(error) }));
        return () => controller.abort();
    }, [id, key]);
    const current = result?.key === key ? result : null;
    const order = current?.data;
    return <Dialog open={Boolean(id)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="lab-result-detail-title">
        <DialogTitle id="lab-result-detail-title">Chi tiết xét nghiệm</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1, overflowWrap: "anywhere" }} aria-busy={!current}>
            {!current && <LinearProgress aria-label="Đang tải chi tiết xét nghiệm" />}
            {current?.error && <Alert severity="error" action={<Button onClick={() => setRevision(value => value + 1)}>Thử lại</Button>}>{current.error}</Alert>}
            {order && <>
                <Typography component="h2" variant="h6">{order.labTestTypeName}</Typography>
                <Typography color="text.secondary">Chỉ định #{order.id} · {order.status === "Completed" ? "Đã có kết quả" : order.status === "Cancelled" ? "Đã hủy" : "Đang chờ"}</Typography>
                {order.clinicalDiagnosis && <Typography sx={{ whiteSpace: "pre-wrap" }}>Chẩn đoán lâm sàng: {order.clinicalDiagnosis}</Typography>}
                {order.result ? <>
                    <Typography sx={{ fontWeight: 650 }}>Kết quả xét nghiệm</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{order.result.resultSummary}</Typography>
                    {order.result.note && <Typography sx={{ whiteSpace: "pre-wrap" }}>Ghi chú: {order.result.note}</Typography>}
                    <Typography variant="caption" color="text.secondary">{new Date(order.result.performedAt + (order.result.performedAt.endsWith("Z") ? "" : "Z")).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</Typography>
                </> : <Typography>Chưa có kết quả.</Typography>}
            </>}
        </Stack></DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>;
}
