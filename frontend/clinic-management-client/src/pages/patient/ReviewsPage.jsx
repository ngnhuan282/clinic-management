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
import { FormatQuoteRounded, RateReviewOutlined, RefreshOutlined } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { useReviewList } from "../../hooks/useReviewList";
import ReviewDialog from "../../components/patient/ReviewDialog";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
    clinicColors,
    clinicPageCanvasSx,
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
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        eyebrow={own ? "Phản hồi chất lượng khám" : "Ý kiến người bệnh"}
                        title={own ? "Đánh giá sau buổi khám" : "Đánh giá bác sĩ & chất lượng khám bệnh"}
                        icon={RateReviewOutlined}
                        description={
                            own
                                ? "Chia sẻ trải nghiệm khám của bạn để giúp phòng khám nâng cao chất lượng phục vụ. Mỗi lượt khám hoàn tất được gửi đánh giá một lần."
                                : "Tổng hợp những nhận xét và đánh giá thực tế từ bệnh nhân đã thăm khám tại phòng khám."
                        }
                        actions={
                            <Button
                                variant="outlined"
                                disabled={loading}
                                onClick={refresh}
                                startIcon={<RefreshOutlined />}
                                sx={clinicSecondaryButtonSx}
                            >
                                Làm mới
                            </Button>
                        }
                    />

                    {message && (
                        <Alert severity="success" onClose={() => setMessage("")} sx={{ borderRadius: "10px" }}>
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ borderRadius: "10px" }}
                            action={
                                <Button color="inherit" onClick={refresh}>
                                    Thử lại
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Summary Strip */}
                    {!loading && !error && (
                        <Typography sx={{ fontSize: 14, color: clinicColors.muted, fontWeight: 650 }}>
                            {own ? "Các buổi khám đã hoàn thành:" : "Danh sách phản hồi công khai:"}{" "}
                            <Box component="span" sx={{ color: "#0A2540", fontWeight: 800 }}>
                                {data?.totalItems || 0} {own ? "lịch hẹn" : "lượt đánh giá"}
                            </Box>
                        </Typography>
                    )}

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
                                            <Skeleton variant="rounded" height={76} sx={{ borderRadius: "10px" }} />
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
                                                title={own ? "Chưa có buổi khám chờ đánh giá" : "Chưa có đánh giá nào"}
                                                message={
                                                    own
                                                        ? "Chưa có lịch hẹn đã hoàn thành để đánh giá."
                                                        : "Chưa có đánh giá công khai nào cho tiêu chí này."
                                                }
                                            />
                                        </Paper>
                                    )}

                                    {data?.items.map(item => {
                                        const reviewed = Boolean(item.reviewId);
                                        const initials =
                                            item.doctorName
                                                ?.trim()
                                                .split(" ")
                                                .slice(-2)
                                                .map(part => part[0])
                                                .join("")
                                                .toUpperCase() || "BS";

                                        return (
                                            <Paper
                                                key={own ? item.appointmentId : item.reviewId}
                                                variant="outlined"
                                                sx={{
                                                    ...clinicSurfaceSx,
                                                    p: { xs: 2.5, sm: 3.25 },
                                                    borderRadius: "14px",
                                                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                                                    "&:hover": {
                                                        borderColor: "#0B4F8A",
                                                        boxShadow: "0 8px 20px rgba(10, 37, 64, 0.07)",
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
                                                                    width: 48,
                                                                    height: 48,
                                                                    bgcolor: "#E6F0FA",
                                                                    color: "#0B4F8A",
                                                                    fontWeight: 800,
                                                                    fontSize: 15,
                                                                    border: "2px solid #90BCE6",
                                                                }}
                                                            >
                                                                {initials}
                                                            </Avatar>
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography
                                                                    component="h2"
                                                                    sx={{
                                                                        fontSize: 17,
                                                                        fontWeight: 800,
                                                                        color: "#0A2540",
                                                                        lineHeight: 1.3,
                                                                        overflowWrap: "anywhere",
                                                                    }}
                                                                >
                                                                    {item.doctorName}
                                                                </Typography>
                                                                <Typography sx={{ mt: 0.35, fontSize: 13.5, color: clinicColors.muted }}>
                                                                    {own
                                                                        ? `Lịch hẹn #${item.appointmentId} · Ngày khám: ${dateText(item.appointmentDate)}`
                                                                        : `Ngày đánh giá: ${dateText(item.createdAt)}`}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>

                                                        {own && (
                                                            <Chip
                                                                size="small"
                                                                variant="outlined"
                                                                label={
                                                                    reviewed
                                                                        ? item.isVisible
                                                                            ? "Đã gửi đánh giá"
                                                                            : "Đánh giá đang được ẩn"
                                                                        : "Có thể đánh giá"
                                                                }
                                                                sx={{
                                                                    alignSelf: { xs: "flex-start", sm: "auto" },
                                                                    bgcolor: reviewed ? "#F8FAFC" : "#E6F0FA",
                                                                    color: reviewed ? "#475569" : "#0B4F8A",
                                                                    borderColor: reviewed ? "#CBD5E1" : "#90BCE6",
                                                                    fontWeight: 700,
                                                                    borderRadius: "8px",
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>

                                                    {item.rating && (
                                                        <Box
                                                            sx={{
                                                                p: 2.25,
                                                                borderRadius: "12px",
                                                                bgcolor: "#F4F7FA",
                                                                border: "1px solid #DCE7F2",
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                                                                <Rating
                                                                    readOnly
                                                                    value={item.rating}
                                                                    size="small"
                                                                    aria-label={`Đánh giá ${item.rating} trên 5 sao`}
                                                                />
                                                                <Chip
                                                                    size="small"
                                                                    label={`${item.rating}/5 sao`}
                                                                    sx={{
                                                                        height: 24,
                                                                        bgcolor: "#FFFBEB",
                                                                        color: "#92400E",
                                                                        border: "1px solid #FCD34D",
                                                                        fontWeight: 750,
                                                                        fontSize: 12,
                                                                    }}
                                                                />
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                                                                <FormatQuoteRounded sx={{ fontSize: 19, color: "#0B4F8A", mt: 0.2, flexShrink: 0 }} />
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: 15,
                                                                        lineHeight: 1.75,
                                                                        color: "#0A2540",
                                                                        whiteSpace: "pre-wrap",
                                                                        overflowWrap: "anywhere",
                                                                    }}
                                                                >
                                                                    {item.comment || "Không có nhận xét chi tiết."}
                                                                </Typography>
                                                            </Stack>
                                                        </Box>
                                                    )}

                                                    {own && !reviewed && (
                                                        <Box sx={{ pt: 1.5, borderTop: "1px solid #E2ECF5" }}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    setMessage("");
                                                                    setSelected(item);
                                                                }}
                                                                startIcon={<RateReviewOutlined />}
                                                                sx={{
                                                                    ...clinicPrimaryButtonSx,
                                                                    px: 2.5,
                                                                    width: { xs: "100%", sm: "auto" },
                                                                }}
                                                            >
                                                                Viết đánh giá
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
                                            <Typography sx={{ fontSize: 13.5, color: clinicColors.muted }}>
                                                Trang {pageNumber}/{data.totalPages} · {data.totalItems}{" "}
                                                {own ? "lịch hẹn" : "đánh giá"}
                                            </Typography>
                                            <Pagination
                                                count={data.totalPages}
                                                page={pageNumber}
                                                onChange={(_, value) => setPageNumber(value)}
                                                color="primary"
                                                shape="rounded"
                                                size="small"
                                                getItemAriaLabel={(type, value) =>
                                                    type === "next"
                                                        ? "Trang tiếp"
                                                        : type === "previous"
                                                        ? "Trang trước"
                                                        : `Trang ${value}`
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
                            setMessage("Đã gửi đánh giá.");
                            refresh();
                        }}
                    />
                )}
            </Container>
        </Box>
    );
}
