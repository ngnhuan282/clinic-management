import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DispensingConfirmDialog from "../../../components/internal/pharmacy/DispensingConfirmDialog";
import DispensingDetailContent from "../../../components/internal/pharmacy/DispensingDetailContent";
import StockReviewDialog from "../../../components/internal/pharmacy/StockReviewDialog";
import { getDispensingStatusConfig } from "../../../components/internal/pharmacy/dispensingStatus";
import useAuth from "../../../hooks/useAuth";
import useDispensingDetail from "../../../hooks/useDispensingDetail";
import formatDate from "../../../utils/formatDate";

function DispensingDetailPage() {
    const { prescriptionId } = useParams();
    const parsedId = Number(prescriptionId);
    const recordId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
    const { userId } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [recheckOpen, setRecheckOpen] = useState(false);
    const { detail, loading, error, refreshWarning, confirming, reviewing, reload, dispense, processReview } =
        useDispensingDetail(recordId, userId, !confirmOpen && !reviewOpen && !recheckOpen);
    const [actionError, setActionError] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const mutating = confirming || reviewing;
    const busy = mutating || Boolean(refreshWarning);
    const status = detail && getDispensingStatusConfig(detail.workflowStatus);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [prescriptionId]);

    const returnToQueue = () => {
        if (mutating) return;
        if (location.state?.dispensingReturn?.userId === userId) navigate(-1);
        else navigate(`/internal/pharmacy/dispensing${location.search}`, { replace: true });
    };

    const refresh = async () => {
        if (mutating) return;
        setActionError("");
        try { await reload(); } catch (err) { setActionError(err.message); }
    };

    const handleConfirm = async () => {
        if (!detail || busy) return;
        setActionError("");
        try {
            const result = await dispense();
            if (!result) return;
            setConfirmOpen(false);
            setSuccessMessage(`Đã giao thuốc và trừ kho cho đơn ${detail.prescriptionCode}.`);
        } catch (err) {
            setConfirmOpen(false);
            setActionError(err.message);
            try { await reload(); } catch { /* Preserve the business error. */ }
        }
    };

    const handleReview = async (request) => {
        if (!detail || busy) return;
        setActionError("");
        setReviewError("");
        try {
            const result = await processReview(request);
            if (!result) return;
            setReviewOpen(false);
            setRecheckOpen(false);
            setSuccessMessage(request ? "Đã lưu và gửi yêu cầu rà soát." : result.reviews[0]?.status === "StillShortage"
                ? "Đã kiểm tra lại: vẫn thiếu thuốc. Vòng rà soát đã kết thúc." : "Đã đối chiếu đủ tồn. Vòng rà soát đã kết thúc.");
        } catch (err) {
            setRecheckOpen(false);
            if (request) setReviewError(err.message);
            else setActionError(err.message);
            try { await reload(); } catch { /* Preserve the action error and the dialog draft. */ }
        }
    };

    return (
        <Stack spacing={3} sx={{ minWidth: 0, maxWidth: 1280, width: "100%", mx: "auto", "& *": { letterSpacing: 0 } }}>
            <Box component="header">
                <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 2, alignItems: { md: "center" }, justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontSize: 14, fontWeight: 500 }}>Dược sĩ / Quầy cấp thuốc / Chi tiết</Typography>
                        <Stack direction="row" useFlexGap sx={{ mt: 0.75, gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                            <Typography component="h1" variant="h4" sx={{ color: "#111827", fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>Chi tiết cấp thuốc</Typography>
                            {detail && <>
                                <Typography sx={{ color: "#005DAC", fontSize: 16, fontWeight: 600, whiteSpace: "nowrap" }}>{detail.prescriptionCode}</Typography>
                                <Chip label={status.label} size="small" sx={{ color: status.color, bgcolor: status.backgroundColor, border: `1px solid ${status.borderColor}`, fontSize: 13, fontWeight: 500 }} />
                                <Typography variant="body2" sx={{ color: "#6B7280", fontSize: 14 }}>Kê ngày {formatDate(detail.prescriptionDate)}</Typography>
                            </>}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", md: "center" }, flexShrink: 0 }}>
                        <Tooltip title="Tải lại chi tiết"><span><IconButton aria-label="Tải lại chi tiết" onClick={refresh} disabled={mutating || loading || !recordId}
                            sx={{ width: 42, height: 42, border: "1px solid #E5E9F0", borderRadius: 1, color: "primary.main" }}><RefreshOutlinedIcon /></IconButton></span></Tooltip>
                        <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={returnToQueue} disabled={mutating}>Quay lại quầy thuốc</Button>
                    </Stack>
                </Stack>
            </Box>
            {actionError && <Alert severity="error" onClose={() => setActionError("")}>{actionError}</Alert>}
            {refreshWarning && <Alert severity="warning" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>
                Chưa cập nhật được đơn thuốc. Các thao tác xử lý tạm khóa. {refreshWarning}
            </Alert>}
            {!recordId ? <ErrorState message="Mã đơn thuốc không hợp lệ." /> : loading ? <Loading /> : error ?
                <ErrorState message={error} onRetry={refresh} /> : detail &&
                <DispensingDetailContent detail={detail} busy={busy} onConfirm={() => setConfirmOpen(true)}
                    onRequestReview={() => { setReviewError(""); setReviewOpen(true); }} onRecheck={() => setRecheckOpen(true)} />}
            <DispensingConfirmDialog key={`dispense-${prescriptionId}-${confirmOpen}`} open={confirmOpen} detail={detail} loading={confirming}
                onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirm} />
            <StockReviewDialog key={`review-${prescriptionId}-${reviewOpen}`} open={reviewOpen} detail={detail} loading={busy || loading} error={reviewError}
                onClose={() => setReviewOpen(false)} onSubmit={handleReview} />
            <ConfirmDialog open={recheckOpen} title="Kiểm tra lại và kết thúc vòng rà soát?"
                message="Tồn còn hạn sẽ được kiểm tra lại theo đơn hiện tại. Vòng rà soát kết thúc với kết quả đủ tồn hoặc vẫn thiếu; thao tác này không giao thuốc hay thay đổi thanh toán."
                confirmText="Kiểm tra lại tồn" cancelText="Quay lại" loading={reviewing}
                onCancel={() => setRecheckOpen(false)} onConfirm={() => handleReview()} />
            <Snackbar open={Boolean(successMessage)} autoHideDuration={3000} onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert severity="success" variant="filled" onClose={() => setSuccessMessage("")}>{successMessage}</Alert>
            </Snackbar>
        </Stack>
    );
}

export default DispensingDetailPage;
