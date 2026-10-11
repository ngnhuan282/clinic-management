import { useState } from "react";
import { Alert, Avatar, Box, Button, Chip, LinearProgress, Pagination, Paper, Rating, Skeleton, Stack, Typography } from "@mui/material";
import { RateReviewOutlined, RefreshOutlined } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { useReviewList } from "../../hooks/useReviewList";
import ReviewDialog from "../../components/patient/ReviewDialog";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import { clinicColors, clinicPrimaryButtonSx, clinicSecondaryButtonSx, clinicSurfaceSx } from "../../components/common/clinicUi";

const dateText = value => new Date(value).toLocaleDateString("vi-VN");

export default function ReviewsPage({ own = false }) {
    const [params] = useSearchParams();
    const doctorId = own ? undefined : params.get("doctorId") || undefined;
    const { data, loading, error, refresh, pageNumber, setPageNumber } = useReviewList(own ? "myAppointments" : "publicList", doctorId);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState("");

    return <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
            <ClinicPageHeader title={own ? "Đánh giá sau buổi khám" : "Đánh giá bác sĩ"} icon={RateReviewOutlined}
                description={own ? "Chia sẻ trải nghiệm của bạn sau khi hoàn thành buổi khám. Mỗi lịch hẹn được đánh giá một lần." : "Những trải nghiệm khám bệnh được chia sẻ công khai."} />
            {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ borderRadius: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{error}</Alert>}
            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                    <Box><Typography sx={{ fontSize: 14, fontWeight: 600 }}>{own ? "Các buổi khám đã hoàn thành" : "Danh sách đánh giá công khai"}</Typography><Typography sx={{ mt: 0.5, fontSize: 13, color: clinicColors.muted }}>{!loading && !error ? `${data?.totalItems || 0} ${own ? "lịch hẹn" : "đánh giá"}` : "Đang kiểm tra danh sách…"}</Typography></Box>
                    <Button variant="outlined" disabled={loading} onClick={refresh} startIcon={<RefreshOutlined />} sx={clinicSecondaryButtonSx}>Làm mới dữ liệu</Button>
                </Stack>
            </Paper>
            <Stack spacing={2} aria-busy={loading}>
                {loading ? <><LinearProgress aria-label="Đang tải đánh giá" />{Array.from({ length: 3 }, (_, index) => <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3 }}><Stack spacing={1.5}><Skeleton width="45%" height={30} /><Skeleton width="30%" /><Skeleton variant="rounded" height={70} /></Stack></Paper>)}</> : !error && <>
                    {!data?.items.length && <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2 }}><EmptyState message={own ? "Chưa có lịch hẹn đã hoàn thành để đánh giá." : "Chưa có đánh giá công khai."} /></Paper>}
                    {data?.items.map(item => {
                        const reviewed = Boolean(item.reviewId);
                        return <Paper key={own ? item.appointmentId : item.reviewId} variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 } }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                                        <Avatar sx={{ width: 42, height: 42, bgcolor: "#E0F2FE", color: "#0369A1", fontSize: 14 }}>{item.doctorName?.trim().split(" ").pop()?.slice(0, 2).toUpperCase()}</Avatar>
                                        <Box sx={{ minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, overflowWrap: "anywhere" }}>{item.doctorName}</Typography><Typography sx={{ mt: 0.5, fontSize: 13, color: clinicColors.muted }}>{own ? `Lịch hẹn #${item.appointmentId} · ${dateText(item.appointmentDate)}` : `Ngày đánh giá ${dateText(item.createdAt)}`}</Typography></Box>
                                    </Stack>
                                    {own && <Chip size="small" label={reviewed ? item.isVisible ? "Đã đánh giá" : "Đánh giá đang được ẩn" : "Có thể đánh giá"} sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, bgcolor: reviewed ? "#F1F5F9" : "#ECFDF5", color: reviewed ? "#64748B" : "#047857", fontWeight: 500 }} />}
                                </Stack>
                                {item.rating && <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Rating readOnly value={item.rating} size="small" aria-label={`Đánh giá ${item.rating} trên 5 sao`} /><Typography sx={{ fontSize: 13, color: clinicColors.muted }}>{item.rating}/5</Typography></Stack>
                                    <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: clinicColors.heading, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.comment || "Không có nhận xét."}</Typography>
                                </Stack>}
                                {own && !reviewed && <Box sx={{ pt: 1.5, borderTop: "1px solid #E2E8F0" }}><Button variant="contained" onClick={() => { setMessage(""); setSelected(item); }} startIcon={<RateReviewOutlined />} sx={{ ...clinicPrimaryButtonSx, width: { xs: "100%", sm: "auto" } }}>Viết đánh giá</Button></Box>}
                            </Stack>
                        </Paper>;
                    })}
                    {data?.totalPages > 1 && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, pt: 1 }}>
                        <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>Trang {pageNumber}/{data.totalPages} · {data.totalItems} {own ? "lịch hẹn" : "đánh giá"}</Typography>
                        <Pagination count={data.totalPages} page={pageNumber} onChange={(_, value) => setPageNumber(value)} color="primary" shape="rounded" size="small" getItemAriaLabel={(type, value) => type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`} />
                    </Stack>}
                </>}
            </Stack>
        </Stack>
        {selected && <ReviewDialog key={selected.appointmentId} appointment={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setMessage("Đã gửi đánh giá."); refresh(); }} />}
    </Box>;
}
