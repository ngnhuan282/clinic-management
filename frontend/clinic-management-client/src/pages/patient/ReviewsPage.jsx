import { useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    LinearProgress,
    Pagination,
    Paper,
    Rating,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import { RateReviewOutlined, RefreshOutlined } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { useReviewList } from "../../hooks/useReviewList";
import ReviewDialog from "../../components/patient/ReviewDialog";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
    clinicColors,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";

const dateText = value => (value ? new Date(value).toLocaleDateString("vi-VN") : "–");

export default function ReviewsPage({ own = false }) {
    const [params] = useSearchParams();
    const doctorId = own ? undefined : params.get("doctorId") || undefined;
    const { data, loading, error, refresh, pageNumber, setPageNumber } = useReviewList(
        own ? "myAppointments" : "publicList",
        doctorId
    );
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState("");

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "85vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        title={own ? "Đánh giá sau buổi khám" : "Đánh giá chất lượng khám bệnh"}
                        icon={RateReviewOutlined}
                        description={
                            own
                                ? "Chia sẻ trải nghiệm khám của bạn để giúp phòng khám nâng cao chất lượng phục vụ. Mỗi lượt khám được đánh giá một lần."
                                : "Tổng hợp những nhận xét và đánh giá thực tế từ bệnh nhân đã trải nghiệm dịch vụ tại phòng khám."
                        }
                    />

                    {message && (
                        <Alert severity="success" onClose={() => setMessage("")} sx={{ borderRadius: "10px" }}>
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>
                            {error}
                        </Alert>
                    )}

                    {/* Summary Bar */}
                    <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: "14px" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                            <Box>
                                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f2c4d" }}>
                                    {own ? "Các buổi khám đã hoàn thành" : "Danh sách đánh giá công khai"}
                                </Typography>
                                <Typography sx={{ mt: 0.5, fontSize: 13, color: clinicColors.muted }}>
                                    {!loading && !error ? `${data?.totalItems || 0} ${own ? "lịch hẹn" : "lượt đánh giá"}` : "Đang tải dữ liệu…"}
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                disabled={loading}
                                onClick={refresh}
                                startIcon={<RefreshOutlined />}
                                sx={{ ...clinicSecondaryButtonSx, borderRadius: "8px" }}
                            >
                                Làm mới dữ liệu
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Review List */}
                    <Stack spacing={2.5} aria-busy={loading}>
                        {loading ? (
                            <>
                                <LinearProgress aria-label="Đang tải đánh giá" sx={{ borderRadius: 1 }} />
                                {Array.from({ length: 3 }, (_, index) => (
                                    <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3, borderRadius: "14px" }}>
                                        <Stack spacing={1.5}>
                                            <Skeleton width="45%" height={30} />
                                            <Skeleton width="30%" />
                                            <Skeleton variant="rounded" height={70} sx={{ borderRadius: "10px" }} />
                                        </Stack>
                                    </Paper>
                                ))}
                            </>
                        ) : (
                            !error && (
                                <>
                                    {!data?.items.length && (
                                        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4, borderRadius: "14px" }}>
                                            <EmptyState
                                                message={
                                                    own
                                                        ? "Chưa có lịch hẹn đã hoàn thành để viết đánh giá."
                                                        : "Chưa có đánh giá công khai nào."
                                                }
                                            />
                                        </Paper>
                                    )}

                                    {data?.items.map(item => {
                                        const reviewed = Boolean(item.reviewId);
                                        const initials = item.doctorName?.trim().split(" ").pop()?.slice(0, 2).toUpperCase() || "BS";

                                        return (
                                            <Paper
                                                key={own ? item.appointmentId : item.reviewId}
                                                variant="outlined"
                                                sx={{
                                                    ...clinicSurfaceSx,
                                                    p: { xs: 2.5, sm: 3.25 },
                                                    borderRadius: "14px",
                                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    "&:hover": {
                                                        borderColor: "#90caf9",
                                                        boxShadow: "0 6px 18px rgba(25, 118, 210, 0.08)",
                                                    },
                                                }}
                                            >
                                                <Stack spacing={2}>
                                                    <Stack
                                                        direction={{ xs: "column", sm: "row" }}
                                                        spacing={1.5}
                                                        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                                                    >
                                                        <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", minWidth: 0 }}>
                                                            <Avatar
                                                                sx={{
                                                                    width: 46,
                                                                    height: 46,
                                                                    bgcolor: "#e0f2fe",
                                                                    color: "primary.main",
                                                                    fontWeight: 750,
                                                                    fontSize: 15,
                                                                    border: "2px solid #bae6fd",
                                                                }}
                                                            >
                                                                {initials}
                                                            </Avatar>
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography
                                                                    component="h2"
                                                                    sx={{ fontSize: 16.5, fontWeight: 750, color: "#0f2c4d", lineHeight: 1.3, overflowWrap: "anywhere" }}
                                                                >
                                                                    {item.doctorName}
                                                                </Typography>
                                                                <Typography sx={{ mt: 0.35, fontSize: 13, color: clinicColors.muted }}>
                                                                    {own
                                                                        ? `Lịch hẹn #${item.appointmentId} · Ngày khám: ${dateText(item.appointmentDate)}`
                                                                        : `Ngày đánh giá: ${dateText(item.createdAt)}`}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                        {own && (
                                                            <Chip
                                                                size="small"
                                                                label={reviewed ? (item.isVisible ? "Đã gửi đánh giá" : "Đánh giá đang được ẩn") : "Có thể đánh giá"}
                                                                sx={{
                                                                    alignSelf: { xs: "flex-start", sm: "auto" },
                                                                    bgcolor: reviewed ? "#F1F5F9" : "#ECFDF5",
                                                                    color: reviewed ? "#64748B" : "#047857",
                                                                    fontWeight: 650,
                                                                    borderRadius: "6px",
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>

                                                    {item.rating && (
                                                        <Stack spacing={1.25} sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #edf2f7" }}>
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                                <Rating
                                                                    readOnly
                                                                    value={item.rating}
                                                                    size="small"
                                                                    aria-label={`Đánh giá ${item.rating} trên 5 sao`}
                                                                />
                                                                <Typography sx={{ fontSize: 13, fontWeight: 650, color: "#d97706" }}>
                                                                    {item.rating}/5 sao
                                                                </Typography>
                                                            </Stack>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: 14,
                                                                    lineHeight: 1.75,
                                                                    color: "#1f2937",
                                                                    whiteSpace: "pre-wrap",
                                                                    overflowWrap: "anywhere",
                                                                }}
                                                            >
                                                                {item.comment || "Không có nhận xét chi tiết."}
                                                            </Typography>
                                                        </Stack>
                                                    )}

                                                    {own && !reviewed && (
                                                        <Box sx={{ pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    setMessage("");
                                                                    setSelected(item);
                                                                }}
                                                                startIcon={<RateReviewOutlined />}
                                                                sx={{
                                                                    ...clinicPrimaryButtonSx,
                                                                    borderRadius: "8px",
                                                                    width: { xs: "100%", sm: "auto" },
                                                                }}
                                                            >
                                                                Viết đánh giá buổi khám
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Paper>
                                        );
                                    })}

                                    {data?.totalPages > 1 && (
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1.5}
                                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, pt: 1 }}
                                        >
                                            <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>
                                                Trang {pageNumber}/{data.totalPages} · {data.totalItems} {own ? "lịch hẹn" : "đánh giá"}
                                            </Typography>
                                            <Pagination
                                                count={data.totalPages}
                                                page={pageNumber}
                                                onChange={(_, value) => setPageNumber(value)}
                                                color="primary"
                                                shape="rounded"
                                                size="small"
                                                getItemAriaLabel={(type, value) =>
                                                    type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`
                                                }
                                            />
                                        </Stack>
                                    )}
                                </>
                            )
                        )}
                    </Stack>
                </Stack>

                {selected && (
                    <ReviewDialog
                        key={selected.appointmentId}
                        appointment={selected}
                        onClose={() => setSelected(null)}
                        onSaved={() => {
                            setSelected(null);
                            setMessage("Đã gửi đánh giá thành công. Cảm ơn bạn đã phản hồi!");
                            refresh();
                        }}
                    />
                )}
            </Container>
        </Box>
    );
}
