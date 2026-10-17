import { useState } from "react";
import { Alert, Avatar, Box, Button, Chip, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { Link, useLocation, useParams } from "react-router-dom";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import StockReviewHistory from "../../../components/internal/pharmacy/StockReviewHistory";
import StockReviewResponseForm from "../../../components/internal/prescriptions/StockReviewResponseForm";
import { PrescriptionMedicineSummary, PrescriptionNotes } from "../../../components/internal/prescriptions/PrescriptionMedicineSummary";
import useAuth from "../../../hooks/useAuth";
import useDoctorStockReview from "../../../hooks/useDoctorStockReview";
import { getStockReviewLockedMessage, getStockReviewStatusConfig } from "../../../utils/stockReviewWorkflow";
import formatDate from "../../../utils/formatDate";

function InfoField({ label, value }) {
    return <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: "block", color: "#6B7280", fontWeight: 500, textTransform: "uppercase" }}>{label}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
    </Box>;
}

export default function DoctorStockReviewDetailPage() {
    const { reviewId } = useParams();
    const id = Number.isSafeInteger(Number(reviewId)) && Number(reviewId) > 0 ? Number(reviewId) : null;
    const { userId } = useAuth();
    const location = useLocation();
    const { detail, options, loading, error, busy, reload, respond } = useDoctorStockReview(id, userId);
    const noticeKey = `${userId}-${id}`;
    const [notice, setNotice] = useState(null);
    const message = notice?.key === noticeKey ? notice.message : "";
    const reviewStatus = detail && getStockReviewStatusConfig(detail.review);
    async function submit(payload) {
        const result = await respond(payload);
        if (!result) return;
        setNotice({ key: noticeKey, message: result.review.decisions[0].outcome === "AwaitingBilling" ? "Đã lưu phương án chờ đối soát hóa đơn." : "Đã lưu phản hồi và gửi đến các bộ phận liên quan." });
        return result;
    }
    return <Stack spacing={3} sx={{ minWidth: 0, maxWidth: 1280, width: "100%", mx: "auto", "& *": { letterSpacing: 0 },
        "& .MuiTypography-body2": { fontSize: 16, lineHeight: 1.5 }, "& .MuiTypography-caption": { fontSize: 14, lineHeight: 1.45 },
        "& .MuiTypography-subtitle1": { fontSize: 18, lineHeight: 1.5 }, "& .MuiChip-root": { fontSize: 13 },
        "& td": { overflowWrap: "anywhere", verticalAlign: "top" } }}>
        <Box component="header">
            <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 2, justifyContent: "space-between", alignItems: { md: "center" } }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>Bác sĩ / Rà soát thuốc thiếu / Chi tiết</Typography>
                    <Stack direction="row" useFlexGap sx={{ mt: 0.75, gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography component="h1" variant="h4" sx={{ color: "#111827", fontSize: 28, lineHeight: 1.3, fontWeight: 700 }}>Xử lý yêu cầu rà soát</Typography>
                        {detail && <>
                            <Typography sx={{ color: "#005DAC", fontSize: 16, fontWeight: 600, whiteSpace: "nowrap" }}>RS-{String(detail.review.reviewId).padStart(5, "0")}</Typography>
                            <Chip size="small" label={reviewStatus.label} sx={{ bgcolor: reviewStatus.background, color: reviewStatus.color, fontWeight: 500, maxWidth: "100%" }} />
                        </>}
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", md: "center" }, flexShrink: 0 }}>
                    <Tooltip title="Tải lại yêu cầu"><span><IconButton aria-label="Tải lại yêu cầu" onClick={reload} disabled={busy || loading || !id} sx={{ width: 42, height: 42, border: "1px solid #E5E9F0", borderRadius: 1, color: "primary.main" }}><RefreshOutlinedIcon /></IconButton></span></Tooltip>
                    <Button component={Link} to={`/internal/doctor/stock-reviews${location.search}`} variant="outlined" disabled={busy} startIcon={<ArrowBackOutlinedIcon />}>Quay lại</Button>
                </Stack>
            </Stack>
        </Box>
        {!id ? <ErrorState message="Mã yêu cầu không hợp lệ." /> : loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : detail && <>
            <Box component="section" aria-label="Thông tin bệnh nhân rà soát" sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: 2, p: { xs: 2, sm: 2.5 }, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "minmax(0, 1.2fr) repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: "flex-start" }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "#F0F4F8", border: "1px solid #D9E2EF", color: "#1F2937", fontSize: 16 }}>{detail.prescription.patientName?.trim().slice(0, 1).toLocaleUpperCase("vi-VN") || "BN"}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500, textTransform: "uppercase" }}>Bệnh nhân</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, overflowWrap: "anywhere" }}>{detail.prescription.patientName}</Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#6B7280", overflowWrap: "anywhere" }}>SĐT: {detail.prescription.patientPhone || "Chưa có"}</Typography>
                        </Box>
                    </Stack>
                    <InfoField label="Bác sĩ kê đơn" value={detail.prescription.doctorName} />
                    <Box>
                        <InfoField label="Đơn thuốc" value={detail.prescription.prescriptionCode} />
                        <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6B7280" }}>Kê ngày {formatDate(detail.prescription.prescriptionDate)}</Typography>
                    </Box>
                    <InfoField label="Mã hồ sơ" value={`HS-${String(detail.prescription.medicalRecordId).padStart(5, "0")}`} />
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2.5, mb: 1, alignItems: "center" }}>
                    <AssignmentOutlinedIcon color="primary" fontSize="small" />
                    <Typography component="h2" variant="body2" sx={{ fontWeight: 700 }}>Tóm tắt lượt khám</Typography>
                </Stack>
                <TableContainer sx={{ border: "1px solid #D9E2EF", borderRadius: 1 }}>
                    <Table size="small" aria-label="Tóm tắt lượt khám" sx={{ tableLayout: "fixed", "& .MuiTableCell-root": { px: { xs: 1.5, sm: 2 }, py: 1.5, fontSize: 16, lineHeight: 1.5 }, "& tr:last-child > *": { borderBottom: 0 } }}>
                        <TableBody>{[{ label: "Triệu chứng", value: detail.prescription.symptoms }, { label: "Kết luận", value: detail.prescription.conclusion }].map(field => <TableRow key={field.label}>
                            <TableCell component="th" scope="row" sx={{ width: { xs: "34%", md: 180 }, color: "#51647D", bgcolor: "#F8FAFC", borderRight: "1px solid #E5E9F0", fontWeight: 500, overflowWrap: "anywhere", verticalAlign: "top" }}>{field.label}</TableCell>
                            <TableCell sx={{ whiteSpace: "pre-wrap" }}>{field.value || "Chưa ghi nhận"}</TableCell>
                        </TableRow>)}</TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Box component="section" aria-label="Đơn thuốc hiện tại" sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                    <LocalPharmacyOutlinedIcon color="primary" fontSize="small" />
                    <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>Đơn thuốc hiện tại</Typography>
                    <Chip size="small" label={detail.prescription.details.length} sx={{ bgcolor: "#EFF6FF", color: "#005DAC", fontWeight: 700 }} />
                </Stack>
                <Stack spacing={2}>
                    {detail.prescription.details.map((medicine, index) => <PrescriptionMedicineSummary key={medicine.medicineId} medicine={medicine} index={index} />)}
                    <PrescriptionNotes notes={detail.prescription.notes} />
                </Stack>
            </Box>
            <StockReviewHistory reviews={[detail.review]} showEmptyResponse={!detail.canRespond} />
            {message && <Alert severity="success" role="status" onClose={() => setNotice(null)} sx={{ overflowWrap: "anywhere" }}>{message}</Alert>}
            {detail.canRespond ? <StockReviewResponseForm key={`${userId}-${id}-${detail.review.updatedAt}`} detail={detail} options={options} busy={busy} onSubmit={submit} /> : <Alert severity="info">{getStockReviewLockedMessage(detail.review)}</Alert>}
        </>}
    </Stack>;
}
