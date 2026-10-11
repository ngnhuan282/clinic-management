import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Pagination, Paper, Rating, Stack, Typography } from "@mui/material";
import { useReviewList } from "../../../hooks/useReviewList";
import { reviewApi } from "../../../api/reviewApi";
import { getApiErrorMessage } from "../../../utils/errorHandler";

export default function ReviewsManagementPage() {
    const { data, loading, error, refresh, pageNumber, setPageNumber } = useReviewList("adminList");
    const [saving, setSaving] = useState(null);
    const [actionError, setActionError] = useState("");
    const toggle = async item => {
        setSaving(item.reviewId);
        setActionError("");
        try { await reviewApi.setVisibility(item.reviewId, !item.isVisible); refresh(); }
        catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
        finally { setSaving(null); }
    };
    return <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Quản lý đánh giá</Typography>
        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
        {loading ? <CircularProgress /> : error ? <Alert severity="error" action={<Button onClick={refresh}>Thử lại</Button>}>{error}</Alert> :
            <Stack spacing={2}>
                {!data?.items.length && <Alert severity="info">Chưa có đánh giá.</Alert>}
                {data?.items.map(item => <Paper variant="outlined" key={item.reviewId} sx={{ p: 3, borderRadius: 3 }}>
                    <Stack spacing={1}>
                        <Typography variant="h6">{item.doctorName} · Lịch hẹn #{item.appointmentId}</Typography>
                        <Rating readOnly value={item.rating} />
                        <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.comment || "Không có nhận xét."}</Typography>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                            <Chip label={item.isVisible ? "Công khai" : "Đã ẩn"} color={item.isVisible ? "success" : "default"} />
                            <Button variant="outlined" onClick={() => toggle(item)} disabled={saving !== null}>
                                {saving === item.reviewId ? "Đang lưu..." : item.isVisible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>)}
                {data?.totalPages > 1 && <Pagination count={data.totalPages} page={pageNumber} onChange={(_, value) => setPageNumber(value)} />}
            </Stack>}
    </Box>;
}
