import {
    Alert, Avatar, Box, Button, Chip, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { PrescriptionMedicineSummary, PrescriptionNotes } from "../prescriptions/PrescriptionMedicineSummary";
import StockReviewHistory from "./StockReviewHistory";
import { getDispensingPaymentLabel } from "./dispensingStatus";
import formatDate from "../../../utils/formatDate";
import { formatDispensedAt } from "../../../utils/dispensingTime";
import { getStockReviewWorkflowStatus } from "../../../utils/stockReviewWorkflow";

function formatUnit(value) {
    const units = { vien: "viên", binh: "bình", goi: "gói", hop: "hộp", but: "bút" };
    return units[value?.trim()?.toLowerCase()] || value || "đơn vị";
}

function InfoField({ label, value, color = "#111827" }) {
    return <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: "block", color: "#6B7280", fontWeight: 500, textTransform: "uppercase" }}>{label}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color, fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>;
}

function DispensingMedicine({ medicine, dispensed, index }) {
    const allocated = medicine.allocations.reduce((total, lot) => total + lot.quantityAllocated, 0);
    const unit = formatUnit(medicine.unit);
    const tableSx = {
        width: "100%", tableLayout: "fixed",
        "& .MuiTableCell-root": { px: { xs: 1, sm: 1.5 }, py: 1.25, fontSize: 16, lineHeight: 1.5, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" },
        "& .MuiTableCell-head": { fontSize: 14, fontWeight: 600, color: "#51647D", letterSpacing: 0, textTransform: "none" },
        "& .MuiTableRow-root": { height: 44 },
        "& tbody tr:last-child > *": { borderBottom: 0 },
    };
    return <PrescriptionMedicineSummary medicine={{ ...medicine, quantity: medicine.quantityPrescribed, availableQuantity: medicine.quantityAvailable }}
        index={index} dispensed={dispensed} quantityDispensed={allocated} hasShortage={!medicine.isFulfillable}>
        <Box sx={{ mt: 2.5, minWidth: 0 }}>
        <Stack direction="row" useFlexGap sx={{ mb: 1, gap: 1, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Inventory2OutlinedIcon color="primary" fontSize="small" />
                <Typography component="h4" variant="body2" sx={{ fontWeight: 700 }}>{dispensed ? "Lô đã xuất" : "Phân bổ lô FEFO"}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{allocated}/{medicine.quantityPrescribed} {unit}</Typography>
        </Stack>
        <TableContainer sx={{ border: "1px solid #D9E2EF", borderRadius: 1 }}>
            <Table size="small" aria-label={`Lô thuốc ${medicine.medicineName}`} sx={[tableSx, {
                "& .MuiTableCell-head": { textTransform: "uppercase" },
                "& tbody td:nth-of-type(2)": { fontSize: { xs: 14, sm: 16 }, whiteSpace: "nowrap" },
            }]}>
                <TableHead><TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ width: "34%" }}>Số lô</TableCell>
                    <TableCell sx={{ width: "38%" }}>Hạn dùng</TableCell>
                    <TableCell align="right" sx={{ width: "28%" }}>{dispensed ? "SL đã giao" : "SL phân bổ"}</TableCell>
                </TableRow></TableHead>
                <TableBody sx={{ "& tr:last-child td": { borderBottom: 0 } }}>
                    {medicine.allocations.map((lot) => <TableRow key={lot.inventoryId}>
                        <TableCell sx={{ fontWeight: 500 }}>{lot.batchNumber}</TableCell>
                        <TableCell>{formatDate(lot.expiryDate)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>{lot.quantityAllocated} {unit}</TableCell>
                    </TableRow>)}
                    {medicine.allocations.length === 0 && <TableRow><TableCell colSpan={3} sx={{ color: "#B91C1C" }}>Không có lô còn hạn để phân bổ.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </TableContainer>
        </Box>
    </PrescriptionMedicineSummary>;
}

function DispensingDetailContent({ detail, busy, onConfirm, onRequestReview, onRecheck }) {
    const activeReview = detail.reviews?.find(review => review.status === "Pending");
    const reviewPhase = activeReview && getStockReviewWorkflowStatus(activeReview);
    const latestReview = detail.reviews?.[0];
    const latestReviewPhase = latestReview && getStockReviewWorkflowStatus(latestReview);
    const awaitingBilling = reviewPhase === "WaitingBilling";
    const dispensed = detail.workflowStatus === "Dispensed";
    const dispensedTime = formatDispensedAt(detail.dispensedAt);
    const hasReviewHistory = Boolean(detail.reviews?.length);
    const waitingForPayment = detail.workflowStatus === "AwaitingPayment"
        && detail.hasSufficientStock && !activeReview && detail.paymentStatus !== "Paid";
    const showDispenseAction = detail.canDispense || waitingForPayment;
    const actions = !dispensed && (showDispenseAction || activeReview || detail.canRequestReview) && <Stack component="footer" aria-label="Thao tác cấp thuốc" direction={{ xs: "column", sm: "row" }} useFlexGap
        sx={{ gap: 1.5,
            flexWrap: "wrap", justifyContent: "flex-end", "& .MuiButton-root": { minHeight: 42, maxWidth: "100%", whiteSpace: "normal", fontSize: 15 } }}>
        {showDispenseAction && <Button variant={detail.canDispense ? "contained" : "outlined"} startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={onConfirm} disabled={busy || !detail.canDispense}>
            {detail.canDispense ? "Xác nhận giao thuốc" : "Chờ thanh toán"}
        </Button>}
        {activeReview && <Button variant="outlined" startIcon={<FactCheckOutlinedIcon />} onClick={onRecheck} disabled={busy || reviewPhase !== "WaitingPharmacyRecheck"}>Kiểm tra lại tồn</Button>}
        {detail.canRequestReview && <Button variant="contained" startIcon={<SendOutlinedIcon />} onClick={onRequestReview} disabled={busy}>Gửi yêu cầu rà soát</Button>}
    </Stack>;

    return <Stack spacing={3} sx={{ minWidth: 0,
        "& .MuiTypography-body2": { fontSize: 16, lineHeight: 1.5 }, "& .MuiTypography-caption": { fontSize: 14, lineHeight: 1.45 },
        "& .MuiTypography-subtitle1": { fontSize: 18, lineHeight: 1.5 }, "& .MuiChip-root": { fontSize: 13 } }}>
        <Box component="section" aria-label="Thông tin bệnh nhân cấp thuốc" sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: 2, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "minmax(0, 1.2fr) repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: "flex-start" }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: "#F0F4F8", border: "1px solid #D9E2EF", color: "#1F2937", fontSize: 16 }}>{detail.patientName?.trim().slice(0, 1).toLocaleUpperCase("vi-VN") || "BN"}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500, textTransform: "uppercase" }}>Bệnh nhân</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, overflowWrap: "anywhere" }}>{detail.patientName}</Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#6B7280", overflowWrap: "anywhere" }}>SĐT: {detail.patientPhone || "Chưa có"}</Typography>
                </Box>
            </Stack>
            <InfoField label="Bác sĩ kê đơn" value={detail.doctorName} />
            <Box>
                <InfoField label="Hóa đơn" value={detail.invoiceId ? `HD-${String(detail.invoiceId).padStart(5, "0")}` : "Chưa có hóa đơn"} />
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontWeight: 500, color: detail.paymentStatus === "Paid" ? "#047857" : "#B45309" }}>
                    {getDispensingPaymentLabel(detail.paymentStatus)}
                </Typography>
            </Box>
            <InfoField label="Mã hồ sơ" value={`HS-${String(detail.medicalRecordId).padStart(5, "0")}`} />
        </Box>
        <Stack spacing={2} sx={{ mt: 2.5, "&:empty": { display: "none" }, "& .MuiAlert-root": { borderRadius: 1, fontSize: 15, lineHeight: 1.5, py: 0.75 },
            "& .MuiAlert-outlined.MuiAlert-colorInfo": { bgcolor: "#F3F8FF", borderColor: "#BFDBFE", color: "#1D4ED8" },
            "& .MuiAlert-outlined.MuiAlert-colorWarning": { bgcolor: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" },
            "& .MuiAlert-outlined.MuiAlert-colorSuccess": { bgcolor: "#ECFDF5", borderColor: "#A7F3D0", color: "#047857" } }}>
        {detail.workflowStatus === "NeedsReview" && <Alert variant="outlined" severity={detail.paymentStatus === "Paid" ? "warning" : "info"}>
            {reviewPhase === "PendingDoctor" ? "Đã gửi yêu cầu rà soát. Đang chờ bác sĩ phản hồi."
                : reviewPhase === "WaitingPharmacyRecheck" ? "Bác sĩ đã phản hồi. Đang chờ kiểm tra lại tồn theo đơn hiện tại."
                : awaitingBilling ? "Đang chờ bộ phận thu phí đối soát phương án điều chỉnh."
                : latestReviewPhase === "StillShortage" ? "Vòng rà soát đã kết thúc, đơn vẫn thiếu tồn còn hạn. Đang chờ bổ sung kho."
                : detail.paymentStatus === "Paid" ? "Tạm dừng cấp thuốc. Đơn đã thanh toán, cần phối hợp bác sĩ và bộ phận thu phí nếu điều chỉnh đơn."
                : "Tạm dừng cấp thuốc; cần đối chiếu lại đơn và tồn còn hạn trước khi giao."}
        </Alert>}
        {!dispensed && !activeReview && detail.hasSufficientStock && <Alert variant="outlined" severity="success">
            {latestReviewPhase === "Completed" ? `Rà soát RS-${String(latestReview.reviewId).padStart(5, "0")} đã đối chiếu đủ tồn.` : "Đơn hiện tại đủ tồn còn hạn."}
        </Alert>}
        {!dispensed && detail.paymentStatus !== "Paid" && <Alert variant="outlined" severity="warning">Chỉ được giao thuốc sau khi hóa đơn thuốc hoặc hóa đơn cuối đã thanh toán.</Alert>}
        {awaitingBilling && <Alert variant="outlined" severity="warning">Phương án của bác sĩ đang chờ đối soát hóa đơn hoặc hoàn tiền. Đơn hiện tại chưa thay đổi; tiếp tục tạm dừng cấp thuốc.</Alert>}
        {dispensed && <Alert variant="outlined" severity="success" icon={<CheckCircleOutlineOutlinedIcon />}>
            Đơn thuốc đã được giao và trừ kho.{detail.dispensedByName && ` Dược sĩ: ${detail.dispensedByName}.`}{dispensedTime && ` Thời gian: ${dispensedTime}.`}
        </Alert>}
        </Stack>
        </Box>
        <Box component="section" aria-label="Đơn thuốc cấp phát" sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                <Inventory2OutlinedIcon color="primary" fontSize="small" />
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>{dispensed ? "Thuốc và lô đã giao" : "Thuốc và phân bổ lô"}</Typography>
                <Chip size="small" label={detail.medicines.length} sx={{ bgcolor: "#EFF6FF", color: "#005DAC", fontWeight: 700 }} />
            </Stack>
            <Stack spacing={2}>
                {detail.medicines.map((medicine, index) => <DispensingMedicine key={medicine.prescriptionDetailId} medicine={medicine} dispensed={dispensed} index={index} />)}
                <PrescriptionNotes notes={detail.notes} />
            </Stack>
        </Box>
        <StockReviewHistory reviews={detail.reviews} footer={actions} />
        {!hasReviewHistory && actions && <Box sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: 2,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}>{actions}</Box>}
    </Stack>;
}

export default DispensingDetailContent;
