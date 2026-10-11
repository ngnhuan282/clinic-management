import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Pagination, Paper, Rating, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useReviewList } from "../../hooks/useReviewList";
import ReviewDialog from "../../components/patient/ReviewDialog";

export default function ReviewsPage({ own = false }) {
    const [params] = useSearchParams();
    const doctorId = own ? undefined : params.get("doctorId") || undefined;
    const { data, loading, error, refresh, pageNumber, setPageNumber } = useReviewList(own ? "myAppointments" : "publicList", doctorId);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState("");
    return <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 5 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>{own ? "Đánh giá sau buổi khám" : "Đánh giá bác sĩ"}</Typography>
        {own && <Typography color="text.secondary" sx={{ mb: 3 }}>Bạn có thể đánh giá một lần cho mỗi lịch hẹn đã hoàn thành.</Typography>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {loading ? <CircularProgress aria-label="Đang tải đánh giá" /> : error ? <Alert severity="error" action={<Button onClick={refresh}>Thử lại</Button>}>{error}</Alert> :
            <Stack spacing={2}>
                {!data?.items.length && <Alert severity="info">{own ? "Chưa có lịch hẹn đã hoàn thành." : "Chưa có đánh giá công khai."}</Alert>}
                {data?.items.map(item => <Paper key={own ? item.appointmentId : item.reviewId} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Stack spacing={1}>
                        <Typography variant="h6">{item.doctorName}</Typography>
                        {own && <Typography color="text.secondary">Lịch hẹn #{item.appointmentId} · {new Date(item.appointmentDate).toLocaleDateString("vi-VN")}</Typography>}
                        {item.rating ? <><Rating readOnly value={item.rating} /><Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.comment || "Không có nhận xét."}</Typography></> :
                            <Box><Button variant="contained" onClick={() => { setMessage(""); setSelected(item); }}>Viết đánh giá</Button></Box>}
                        {own && item.reviewId && <Chip sx={{ alignSelf: "flex-start" }} label={item.isVisible ? "Đã đánh giá" : "Đánh giá đang được ẩn"} />}
                    </Stack>
                </Paper>)}
                {data?.totalPages > 1 && <Pagination count={data.totalPages} page={pageNumber} onChange={(_, value) => setPageNumber(value)} />}
            </Stack>}
        {selected && <ReviewDialog key={selected.appointmentId} appointment={selected} onClose={() => setSelected(null)}
            onSaved={() => { setSelected(null); setMessage("Đã gửi đánh giá."); refresh(); }} />}
    </Box>;
}
