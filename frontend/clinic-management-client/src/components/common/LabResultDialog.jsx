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
    return <Dialog open={Boolean(id)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="lab-result-detail-title" slotProps={{ paper: { sx: { borderRadius: "16px", p: 1 } } }}>
        <DialogTitle id="lab-result-detail-title" sx={{ fontWeight: 800, fontSize: 19, color: "#0f2c4d", pt: 2.5 }}>Chi tiết xét nghiệm</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1, overflowWrap: "anywhere" }} aria-busy={!current}>
            {!current && <LinearProgress aria-label="Đang tải chi tiết xét nghiệm" sx={{ borderRadius: 1 }} />}
            {current?.error && <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button color="inherit" onClick={() => setRevision(value => value + 1)}>Thử lại</Button>}>{current.error}</Alert>}
            {order && <>
                <Box>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, color: "#1f2937" }}>{order.labTestTypeName}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13.5 }}>Chỉ định #{order.id} · {order.status === "Completed" ? "Đã có kết quả" : order.status === "Cancelled" ? "Đã hủy" : "Đang chờ kết quả"}</Typography>
                </Box>
                {order.clinicalDiagnosis && <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14, color: "#374151" }}>Chẩn đoán lâm sàng: <strong>{order.clinicalDiagnosis}</strong></Typography>}
                {order.result ? <Box sx={{ p: 2.5, bgcolor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <Typography sx={{ fontWeight: 700, color: "primary.main", mb: 1, fontSize: 14 }}>Kết luận xét nghiệm</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75, fontSize: 14.5, color: "#1f2937", mb: 1.5 }}>{order.result.resultSummary}</Typography>
                    {order.result.note && <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 13, color: "text.secondary", mb: 1 }}>Ghi chú: {order.result.note}</Typography>}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 12 }}>Thời gian thực hiện: {new Date(order.result.performedAt + (order.result.performedAt.endsWith("Z") ? "" : "Z")).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</Typography>
                </Box> : <Typography sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "10px", color: "text.secondary", fontSize: 14 }}>Chưa có kết quả xét nghiệm.</Typography>}
            </>}
        </Stack></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose} variant="contained" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, px: 2.5 }}>Đóng</Button></DialogActions>
    </Dialog>;
}
