import { useEffect, useState } from "react";
import {
    Accordion, AccordionDetails, AccordionSummary, Box, Chip, Container, Pagination, Stack, Typography,
} from "@mui/material";
import { ExpandMoreRounded, ReceiptLongOutlined } from "@mui/icons-material";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import { clinicPageCanvasSx } from "../../components/common/clinicUi";
import invoiceApi from "../../api/invoiceApi";
import useAuth from "../../hooks/useAuth";
import getApiErrorMessage from "../../utils/errorHandler";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const stages = { Book: "Sổ khám", Pending: "Phí khám", LabAndConsultation: "Khám và xét nghiệm", Medicine: "Thuốc", Final: "Cuối lượt khám" };
const statuses = { Unpaid: "Chưa thanh toán", PartiallyPaid: "Thanh toán một phần", Paid: "Đã thanh toán đủ", Refunded: "Đã hoàn tiền", Adjusted: "Đã điều chỉnh" };
const methods = { Cash: "Tiền mặt", Transfer: "Chuyển khoản", CreditCard: "Thẻ ngân hàng" };

function InvoiceCard({ invoice }) {
    const isAdjustment = invoice.originalInvoiceId != null;
    const title = isAdjustment ? `Điều chỉnh hóa đơn #${invoice.originalInvoiceId}` : stages[invoice.billingStage] ?? "Hóa đơn";
    const amounts = isAdjustment
        ? [["Thay đổi chi phí", invoice.totalAmount], ["Thay đổi phần BHYT", invoice.insuranceAmount], ["Thay đổi phần bệnh nhân", invoice.patientAmount]]
        : [["Tổng chi phí", invoice.totalAmount], ["Phần BHYT", invoice.insuranceAmount], ["Bệnh nhân phải trả", invoice.patientAmount],
            ["Đã thanh toán sau hoàn tiền", invoice.paidAmount], ["Còn phải thanh toán", invoice.remainingAmount]];
    return (
        <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ width: "100%", pr: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{title} · #{invoice.id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {dateTime.format(new Date(invoice.createdAt))}
                            {invoice.appointmentId ? ` · Lượt khám #${invoice.appointmentId}` : ""}
                        </Typography>
                    </Box>
                    <Chip size="small" label={statuses[invoice.status] ?? invoice.status} color={invoice.status === "Paid" ? "success" : "default"} />
                    <Typography fontWeight={700}>{currency.format(invoice.patientAmount)}</Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, m: 0 }}>
                        {amounts.map(([label, amount]) => (
                            <Box key={label} sx={{ display: "contents" }}>
                                <Typography component="dt" variant="body2">{label}</Typography>
                                <Typography component="dd" variant="body2" fontWeight={700} sx={{ m: 0 }}>{currency.format(amount)}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box>
                        <Typography component="h2" variant="subtitle1" fontWeight={700}>Khoản mục trên chứng từ</Typography>
                        <Box component="ul" sx={{ my: 0.5, pl: 2.5, overflowWrap: "anywhere" }}>
                            {invoice.details.map((line, index) => (
                                <Typography key={index} component="li" variant="body2">
                                    {line.name} · {line.quantity} × {currency.format(line.unitPrice)} = {currency.format(line.total)}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                    <Box>
                        <Typography component="h2" variant="subtitle1" fontWeight={700}>Các lần thanh toán và hoàn tiền</Typography>
                        {invoice.payments.length ? (
                            <Box component="ul" sx={{ my: 0.5, pl: 2.5 }}>
                                {invoice.payments.map((payment, index) => (
                                    <Typography key={payment.receiptNumber ?? index} component="li" variant="body2">
                                        {payment.type === "Refund" ? "Hoàn" : "Đã thu"} {currency.format(payment.amount)}
                                        {" · "}{dateTime.format(new Date(payment.paidAt))}
                                        {payment.method ? ` · ${methods[payment.method] ?? payment.method}` : ""}
                                        {payment.receiptNumber ? ` · Phiếu ${payment.receiptNumber}` : ""}
                                    </Typography>
                                ))}
                            </Box>
                        ) : <Typography variant="body2" color="text.secondary">Chưa có chi tiết giao dịch cho chứng từ này.</Typography>}
                    </Box>
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
}

export default function PatientInvoicesPage() {
    const { userId } = useAuth();
    const [pageNumber, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState(null);
    const key = `${userId}:${pageNumber}:${revision}`;
    const current = state?.key === key ? state : null;

    useEffect(() => {
        const request = new AbortController();
        invoiceApi.getPatientInvoices(pageNumber, request.signal).then(({ data }) => {
            if (!request.signal.aborted) setState({ key, page: data.result });
        }).catch(error => {
            if (!request.signal.aborted) setState({ key, error: getApiErrorMessage(error, "Không thể tải hóa đơn.") });
        });
        return () => request.abort();
    }, [key, pageNumber]);

    return (
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={2.5}>
                    <ClinicPageHeader title="Hóa đơn của tôi" icon={ReceiptLongOutlined} description="Xem chi phí và các lần thanh toán đã ghi nhận tại quầy." />
                    {!current && <Loading />}
                    {current?.error && <ErrorState message={current.error} onRetry={() => setRevision(v => v + 1)} />}
                    {current?.page && (
                        <>
                            {current.page.items.length ? current.page.items.map(invoice => (
                                <InvoiceCard key={`${invoice.source}-${invoice.id}`} invoice={invoice} />
                            )) : <EmptyState title="Chưa có hóa đơn" />}
                            {current.page.totalPages > 1 && <Pagination aria-label="Trang hóa đơn" count={current.page.totalPages}
                                page={pageNumber} onChange={(_, page) => setPage(page)} color="primary" />}
                        </>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}
