import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Grid, Paper, Rating, Skeleton, Stack, Typography } from "@mui/material";
import { StarOutlineRounded } from "@mui/icons-material";
import ClinicPageHeader, { ClinicPagination } from "../../../components/common/ClinicPageHeader";
import { AdminHideIcon, AdminRefreshIcon, AdminViewIcon, clinicSecondaryButtonSx, clinicSurfaceSx } from "../../../components/common/clinicUi";
import DoctorRatingsTable from "../../../components/internal/reviews/DoctorRatingsTable";
import { formatRating } from "../../../utils/formatRating";
import { useReviewList } from "../../../hooks/useReviewList";
import { reviewApi } from "../../../api/reviewApi";
import { getApiErrorMessage } from "../../../utils/errorHandler";

export default function ReviewsManagementPage() {
    const [params, setParams] = useSearchParams();
    const requestedDoctor = Number(params.get("doctorId"));
    const doctorId = Number.isInteger(requestedDoctor) && requestedDoctor > 0 && requestedDoctor <= 2147483647 ? requestedDoctor : undefined;
    const reviews = useReviewList("adminList", doctorId);
    const statistics = useReviewList("adminStatistics", doctorId);
    const [saving, setSaving] = useState(null);
    const [actionError, setActionError] = useState("");
    const pending = useRef(null);
    const totals = statistics.data?.totals;
    const chooseDoctor = id => {
        reviews.setPageNumber(1);
        statistics.setPageNumber(1);
        setParams(id ? { doctorId: String(id) } : {});
    };
    const toggle = async item => {
        if (pending.current !== null) return;
        pending.current = item.reviewId;
        setSaving(item.reviewId); setActionError("");
        try {
            await reviewApi.setVisibility(item.reviewId, !item.isVisible);
            reviews.refresh(); statistics.refresh();
        } catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
        finally { pending.current = null; setSaving(null); }
    };
    const cards = [
        ["Tổng đánh giá", totals?.totalReviews],
        ["Đang công khai", totals?.visibleReviews],
        ["Đã ẩn", totals?.hiddenReviews],
        ["Điểm trung bình công khai", formatRating(totals?.publicAverageRating)],
    ];
    return <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
        <ClinicPageHeader title="Quản lý đánh giá" icon={StarOutlineRounded}
            eyebrow="Quản trị hệ thống"
            description="Tổng hợp điểm theo bác sĩ và duyệt nhận xét. Điểm công khai chỉ tính các đánh giá đang hiển thị."
            actions={<Button variant="outlined" startIcon={<AdminRefreshIcon />} sx={clinicSecondaryButtonSx} onClick={() => { reviews.refresh(); statistics.refresh(); }}>Làm mới</Button>} />
        {doctorId && <Alert severity="info" action={<Button color="inherit" onClick={() => chooseDoctor(null)}>Xóa lọc bác sĩ</Button>}>Đang lọc đánh giá của bác sĩ #{doctorId}.</Alert>}
        {actionError && <Alert severity="error">{actionError}</Alert>}
        <Grid container spacing={2}>{cards.map(([title, value]) => <Grid key={title} size={{ xs: 12, sm: 6, lg: 3 }}><Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            {statistics.loading ? <Skeleton height={42} width={90} /> : <Typography sx={{ fontSize: 26, fontWeight: 750, mt: 1, color: "primary.main", fontVariantNumeric: "tabular-nums" }}>{statistics.error ? "—" : value}</Typography>}
        </Paper></Grid>)}</Grid>
        <Box component="section">
            <Typography component="h2" variant="h6" sx={{ fontWeight: 750, mb: 2 }}>Tổng hợp theo bác sĩ</Typography>
            {statistics.loading ? <Skeleton variant="rounded" height={180} /> : statistics.error
                ? <Alert severity="error" action={<Button onClick={statistics.refresh}>Thử lại thống kê</Button>}>{statistics.error}</Alert>
                : <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                    <DoctorRatingsTable data={statistics.data?.doctors} onSelect={chooseDoctor} />
                    <ClinicPagination
                        page={statistics.pageNumber}
                        pageSize={statistics.pageSize}
                        totalItems={statistics.data?.doctors?.totalItems ?? (statistics.data?.doctors?.items?.length || 0)}
                        label="bác sĩ"
                        navLabel="Phân trang điểm bác sĩ"
                        disabled={statistics.loading}
                        onPageChange={statistics.setPageNumber}
                        onPageSizeChange={statistics.setPageSize}
                    />
                </Paper>}
        </Box>
        <Box component="section" sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 750, mb: 2 }}>Nhận xét của bệnh nhân</Typography>
            {reviews.loading ? <Skeleton variant="rounded" height={220} /> : reviews.error
                ? <Alert severity="error" action={<Button onClick={reviews.refresh}>Thử lại danh sách</Button>}>{reviews.error}</Alert>
                : <Stack spacing={2}>
                    {!reviews.data?.items.length && <Alert severity="info">Chưa có đánh giá phù hợp.</Alert>}
                    {reviews.data?.items.map(item => <Paper variant="outlined" key={item.reviewId} sx={{ p: 3, borderRadius: 3 }}>
                        <Stack spacing={1.5}>
                            <Typography component="h3" variant="h6">{item.doctorName} · Lịch hẹn #{item.appointmentId}</Typography>
                            <Rating readOnly value={item.rating} />
                            <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.comment || "Không có nhận xét."}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</Typography>
                            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                <Chip label={item.isVisible ? "Công khai" : "Đã ẩn"} color={item.isVisible ? "success" : "default"} />
                                <Button
                                    variant="outlined"
                                    startIcon={item.isVisible ? <AdminHideIcon /> : <AdminViewIcon />}
                                    sx={clinicSecondaryButtonSx}
                                    onClick={() => toggle(item)}
                                    disabled={saving !== null}
                                >
                                    {saving === item.reviewId ? "Đang lưu…" : item.isVisible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>)}
                    <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                        <ClinicPagination
                            page={reviews.pageNumber}
                            pageSize={reviews.pageSize}
                            totalItems={reviews.data?.totalItems ?? (reviews.data?.items?.length || 0)}
                            label="nhận xét"
                            navLabel="Phân trang nhận xét"
                            disabled={reviews.loading}
                            borderTop={false}
                            onPageChange={reviews.setPageNumber}
                            onPageSizeChange={reviews.setPageSize}
                        />
                    </Paper>
                </Stack>}
        </Box>
    </Stack>;
}
