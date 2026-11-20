import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import formatCurrency from "../../../utils/formatCurrency";
import formatDate from "../../../utils/formatDate";

const invoiceCode = id => `HD-${String(id).padStart(5, "0")}`;
const paymentMethods = { Cash: "Tiền mặt", Transfer: "Chuyển khoản", CreditCard: "Thẻ" };

function PaymentStatus({ status }) {
    const isPaid = status === "Paid";
    return (
        <Chip
            size="small"
            variant="outlined"
            label={isPaid ? "Đã thanh toán" : status === "PartiallyPaid" ? "Đã thanh toán một phần" : "Chưa thanh toán"}
            sx={{
                borderRadius: "8px",
                fontWeight: 700,
                bgcolor: isPaid ? "#ECFDF5" : "#FFFBEB",
                color: isPaid ? "#065F46" : "#92400E",
                borderColor: isPaid ? "#6EE7B7" : "#FCD34D",
            }}
        />
    );
}

function MedicineInvoiceDialog({ invoice, prescriptionCode, onClose }) {
    if (!invoice) return null;
    const totals = [
        ["Tiền thuốc của đơn này", invoice.medicineAmount],
        ["Tổng tiền hóa đơn", invoice.totalAmount],
        ["BHYT chi trả", invoice.insuranceAmount],
        ["Bệnh nhân phải trả", invoice.patientAmount],
        ["Đã thanh toán trên hóa đơn", invoice.paidAmount],
        ["Còn phải trả trên hóa đơn", invoice.remainingAmount],
    ];
    return (
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth="md"
            aria-labelledby="medicine-invoice-title"
            className="medical-history-no-print"
            slotProps={{ paper: { sx: { borderRadius: "16px", maxHeight: "calc(100dvh - 48px)" } } }}
        >
            <DialogTitle sx={{ p: 2.5, bgcolor: "#EAF2FA", borderBottom: "1px solid #C5D8EC" }}>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
                    <ReceiptLongOutlinedIcon sx={{ color: "#0B4F8A", flexShrink: 0, mt: 0.5 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            id="medicine-invoice-title"
                            component="span"
                            variant="h6"
                            sx={{ fontWeight: 800, color: "#0A2540" }}
                        >
                            Hóa đơn {invoiceCode(invoice.invoiceId)}
                        </Typography>
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap", mt: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">
                                {invoice.billingStage === "Final" ? "Hóa đơn cuối lượt" : "Hóa đơn thuốc"}
                            </Typography>
                            <PaymentStatus status={invoice.status} />
                        </Stack>
                    </Box>
                    <Tooltip title="Đóng hóa đơn">
                        <IconButton
                            onClick={onClose}
                            aria-label="Đóng hóa đơn"
                            sx={{
                                width: 36,
                                height: 36,
                                flexShrink: 0,
                                border: "1px solid #B8CCE0",
                                bgcolor: "#FFFFFF",
                                color: "#0A2540",
                            }}
                        >
                            <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ p: 2.5, pt: "20px !important" }}>
                <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap", mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Ngày lập: {formatDate(invoice.createdAt)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0B4F8A", fontWeight: 750 }}>
                        Đơn thuốc: {prescriptionCode}
                    </Typography>
                    {invoice.status === "Paid" && (
                        <Typography variant="body2" color="text.secondary">
                            Thanh toán: {paymentMethods[invoice.paymentMethod] || invoice.paymentMethod}
                        </Typography>
                    )}
                </Stack>
                <TableContainer sx={{ border: "1px solid #C5D8EC", borderRadius: "10px" }}>
                    <Table aria-label="Chi tiết hóa đơn của lượt khám" sx={{ minWidth: 560 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#EAF2FA" }}>
                                {["Khoản mục", "Số lượng", "Đơn giá", "Thành tiền"].map((label, index) => (
                                    <TableCell
                                        key={label}
                                        align={index ? "right" : "left"}
                                        sx={{ color: "#0A2540", fontSize: 12.5, fontWeight: 800, textTransform: "uppercase" }}
                                    >
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoice.details.map(item => (
                                <TableRow
                                    key={item.invoiceDetailId}
                                    sx={{
                                        "& td": { verticalAlign: "top", fontVariantNumeric: "tabular-nums" },
                                        "&:last-child td": { borderBottom: 0 },
                                    }}
                                >
                                    <TableCell sx={{ minWidth: 180, overflowWrap: "anywhere" }}>
                                        <Typography variant="body2" sx={{ color: "#0A2540", fontWeight: 700 }}>
                                            {item.itemName}
                                        </Typography>
                                        {item.isPrescriptionMedicine && (
                                            <Typography variant="caption" sx={{ color: "#0B4F8A", fontWeight: 700 }}>
                                                Thuốc của đơn {prescriptionCode}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                        {formatCurrency(item.unitPrice)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 750, color: "#0A2540" }}>
                                        {formatCurrency(item.totalPrice)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box
                    component="dl"
                    sx={{
                        m: 0,
                        mt: 2.5,
                        p: 2,
                        borderRadius: "10px",
                        bgcolor: "#F4F7FA",
                        border: "1px solid #C5D8EC",
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 1.25,
                        alignItems: "baseline",
                    }}
                >
                    {totals
                        .filter(([, amount]) => amount !== null && amount !== undefined)
                        .map(([label, amount]) => (
                            <Box key={label} component="div" sx={{ display: "contents" }}>
                                <Typography component="dt" variant="body2" color="text.secondary">
                                    {label}
                                </Typography>
                                <Typography
                                    component="dd"
                                    variant="body2"
                                    sx={{ m: 0, color: "#0A2540", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
                                >
                                    {formatCurrency(amount)}
                                </Typography>
                            </Box>
                        ))}
                </Box>
                {invoice.insuranceAmount === null && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Hóa đơn này chưa có dữ liệu tách phần BHYT và phần bệnh nhân phải trả.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, borderTop: "1px solid #C5D8EC" }}>
                <Button variant="contained" onClick={onClose} sx={{ borderRadius: "10px", px: 2.5 }}>
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function PatientMedicineBillingSection({ billing, prescriptionCode }) {
    const [selectedId, setSelectedId] = useState(null);
    const hasBillingData = Array.isArray(billing?.invoices);
    const invoices = hasBillingData ? billing.invoices : [];
    const hasMedicineAmount = hasBillingData && typeof billing.totalMedicineAmount === "number";
    const selectedInvoice = invoices.find(invoice => invoice.invoiceId === selectedId);

    return (
        <Box component="section" aria-labelledby="patient-medicine-billing-title" sx={{ borderTop: "1px solid #C5D8EC" }}>
            <Stack
                direction="row"
                sx={{
                    px: 2.5,
                    py: 2,
                    gap: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    bgcolor: "#EAF2FA",
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Stack direction="row" sx={{ gap: 1.25, alignItems: "center" }}>
                    <ReceiptLongOutlinedIcon sx={{ color: "#0B4F8A", fontSize: 20 }} />
                    <Typography id="patient-medicine-billing-title" component="h3" variant="subtitle2" sx={{ color: "#0A2540", fontWeight: 800, fontSize: 15 }}>
                        Chi phí thuốc
                    </Typography>
                </Stack>
                {hasMedicineAmount && (
                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography variant="caption" color="text.secondary">
                            Tiền thuốc trên hóa đơn (trước BHYT)
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#0B4F8A", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(billing.totalMedicineAmount)}
                        </Typography>
                    </Box>
                )}
            </Stack>

            {!hasBillingData ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                    Chưa tải được dữ liệu chi phí thuốc.
                </Typography>
            ) : !invoices.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                    Chưa có hóa đơn thuốc.
                </Typography>
            ) : (
                <Box sx={{ px: 2.5 }}>
                    {invoices.map((invoice, index) => (
                        <Stack
                            key={invoice.invoiceId}
                            direction={{ xs: "column", sm: "row" }}
                            sx={{
                                gap: 2,
                                py: 2,
                                alignItems: { sm: "center" },
                                borderTop: index ? "1px solid #E2ECF5" : 0,
                            }}
                        >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                                    <Typography variant="body2" sx={{ color: "#0B4F8A", fontWeight: 800 }}>
                                        {invoiceCode(invoice.invoiceId)}
                                    </Typography>
                                    <PaymentStatus status={invoice.status} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.6 }}>
                                    Ngày lập: {formatDate(invoice.createdAt)}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: "#0A2540", fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
                                Tiền thuốc: {formatCurrency(invoice.medicineAmount)}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<VisibilityOutlinedIcon />}
                                onClick={() => setSelectedId(invoice.invoiceId)}
                                className="medical-history-no-print"
                                sx={{
                                    flexShrink: 0,
                                    alignSelf: { xs: "flex-start", sm: "center" },
                                    borderRadius: "10px",
                                    borderColor: "#90BCE6",
                                    color: "#0B4F8A",
                                    fontWeight: 700,
                                }}
                            >
                                Xem hóa đơn
                            </Button>
                        </Stack>
                    ))}
                </Box>
            )}

            <MedicineInvoiceDialog
                invoice={selectedInvoice}
                prescriptionCode={prescriptionCode}
                onClose={() => setSelectedId(null)}
            />
        </Box>
    );
}

export default PatientMedicineBillingSection;
