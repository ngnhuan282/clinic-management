import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { BiotechOutlined } from "@mui/icons-material";
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
        labTestApi
            .getDetail(id, { signal: controller.signal })
            .then(response => !controller.signal.aborted && setResult({ key, data: response.data }))
            .catch(
                error =>
                    !controller.signal.aborted &&
                    setResult({ key, error: getApiErrorMessage(error) })
            );
        return () => controller.abort();
    }, [id, key]);
    const current = result?.key === key ? result : null;
    const order = current?.data;

    return (
        <Dialog
            open={Boolean(id)}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            aria-labelledby="lab-result-detail-title"
        >
            <DialogTitle
                id="lab-result-detail-title"
                sx={{ fontWeight: 800, fontSize: 19.5, color: "#0A2540", pt: 3 }}
            >
                Chi tiết xét nghiệm
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.25} sx={{ pt: 0.5, overflowWrap: "anywhere" }} aria-busy={!current}>
                    {!current && (
                        <LinearProgress aria-label="Đang tải chi tiết xét nghiệm" sx={{ borderRadius: 1 }} />
                    )}
                    {current?.error && (
                        <Alert
                            severity="error"
                            sx={{ borderRadius: "10px" }}
                            action={
                                <Button color="inherit" onClick={() => setRevision(value => value + 1)}>
                                    Thử lại
                                </Button>
                            }
                        >
                            {current.error}
                        </Alert>
                    )}
                    {order && (
                        <>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "10px",
                                        bgcolor: "#E6F0FA",
                                        color: "#0B4F8A",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <BiotechOutlined />
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography component="h2" variant="h6" sx={{ fontWeight: 800, color: "#0A2540" }}>
                                        {order.labTestTypeName}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.35, flexWrap: "wrap" }}>
                                        <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
                                            Chỉ định #{order.id}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={
                                                order.status === "Completed"
                                                    ? "Đã có kết quả"
                                                    : order.status === "Cancelled"
                                                    ? "Đã hủy"
                                                    : "Đang chờ kết quả"
                                            }
                                            sx={{
                                                height: 24,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                bgcolor: order.status === "Completed" ? "#ECFDF5" : "#FFFBEB",
                                                color: order.status === "Completed" ? "#065F46" : "#92400E",
                                            }}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>

                            {order.clinicalDiagnosis && (
                                <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#F4F7FA", border: "1px solid #CEDCEB" }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.35 }}>
                                        Chẩn đoán lâm sàng khi chỉ định
                                    </Typography>
                                    <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14.5, fontWeight: 650, color: "#0A2540" }}>
                                        {order.clinicalDiagnosis}
                                    </Typography>
                                </Box>
                            )}

                            {order.result ? (
                                <Box
                                    sx={{
                                        p: 2.5,
                                        bgcolor: "#EAF2FA",
                                        borderRadius: "12px",
                                        border: "1px solid #90BCE6",
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 800, color: "#0B4F8A", mb: 1, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        Kết luận xét nghiệm
                                    </Typography>
                                    <Typography
                                        sx={{
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.75,
                                            fontSize: 15,
                                            color: "#0A2540",
                                            fontWeight: 600,
                                            mb: 1.5,
                                        }}
                                    >
                                        {order.result.resultSummary}
                                    </Typography>
                                    {order.result.note && (
                                        <Typography
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                fontSize: 14,
                                                color: "#1E293B",
                                                mb: 1,
                                            }}
                                        >
                                            Ghi chú: {order.result.note}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 12.5 }}>
                                        Thời gian thực hiện:{" "}
                                        {new Date(
                                            order.result.performedAt +
                                                (order.result.performedAt.endsWith("Z") ? "" : "Z")
                                        ).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography
                                    sx={{
                                        p: 2,
                                        bgcolor: "#F8FAFC",
                                        borderRadius: "12px",
                                        border: "1px dashed #B8CCE0",
                                        color: "text.secondary",
                                        fontSize: 14.5,
                                    }}
                                >
                                    Chưa có kết quả xét nghiệm.
                                </Typography>
                            )}
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3 }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}
