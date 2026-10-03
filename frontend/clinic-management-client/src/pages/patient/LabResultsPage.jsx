import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, Chip, Container, Stack, Typography } from "@mui/material";
import labTestApi from "../../api/labTestApi";
import getApiErrorMessage from "../../utils/errorHandler";

export default function LabResultsPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await labTestApi.getAll();
            setOrders(response.data);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "Không thể tải kết quả xét nghiệm."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { void loadOrders(); }, 0);
        return () => clearTimeout(timer);
    }, [loadOrders]);

    return <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>Kết quả xét nghiệm</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>Xem chỉ định và kết quả xét nghiệm của bạn.</Typography>
            </Box>
            {error && <Alert severity="error" action={<Button onClick={loadOrders}>Thử lại</Button>}>{error}</Alert>}
            {loading && <Typography>Đang tải kết quả…</Typography>}
            {!loading && !error && orders.length === 0 && <Alert severity="info">Bạn chưa có chỉ định xét nghiệm.</Alert>}
            {!loading && orders.map(order => <Card key={order.id} variant="outlined" sx={{ p: 2.5 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                    <Box>
                        <Typography variant="h6">{order.labTestTypeName}</Typography>
                        <Typography variant="body2" color="text.secondary">Mã #{order.id} · {new Date(order.createdAt).toLocaleDateString("vi-VN")}</Typography>
                    </Box>
                    <Chip label={order.status === "Completed" ? "Đã có kết quả" : "Đang chờ"}
                        color={order.status === "Completed" ? "success" : "warning"} size="small" />
                </Stack>
                {order.result ? <Stack spacing={1} sx={{ mt: 2 }}>
                    <Typography fontWeight={700}>Kết quả: {order.result.resultSummary}</Typography>
                    {order.result.note && <Typography variant="body2">Ghi chú: {order.result.note}</Typography>}
                </Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>Chưa có kết quả. Vui lòng kiểm tra lại sau.</Typography>}
            </Card>)}
        </Stack>
    </Container>;
}
