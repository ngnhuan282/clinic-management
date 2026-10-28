import { useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { createBookInvoice, issueBook, markBookInvoicePaid } from "../../api/receptionApi";
import { appointmentButtonSx, appointmentColors as colors, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx } from "../appointments/appointmentUi";

export default function ReceptionBookPayment({ patientId, books, invoices, readyInvoices, busy, recordsLoaded, run, refreshBooks, onIssued }) {
    const [amount, setAmount] = useState("");
    const [newBookNumber, setNewBookNumber] = useState("");
    const [paymentReceived, setPaymentReceived] = useState(false);

    return <Box sx={{ borderTop: "1px solid", borderColor: colors.borderSoft, pt: 2 }}>
        <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600, color: colors.heading }}>Phát hoặc cấp lại sổ sau thanh toán</Typography>
        {readyInvoices.length > 0 && <Alert severity="success" sx={{ mt: 1.5 }}>
            Hóa đơn {readyInvoices.map(invoice => `#${invoice.bookInvoiceId}`).join(", ")} đã thanh toán.
            Nhập số sổ để phát hoặc cấp lại sổ cho bệnh nhân.
            {books.some(book => book.status === "Issued") && " Cấp lại sẽ ngừng hiệu lực sổ cũ."}
        </Alert>}
        <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
            <TextField size="small" label="Phí sổ khám (VNĐ)" type="number" value={amount} disabled={busy || !recordsLoaded}
                slotProps={{ htmlInput: { min: 1 } }} onChange={event => setAmount(event.target.value)} />
            <Button sx={appointmentSecondaryButtonSx} disabled={busy || !recordsLoaded || !Number.isFinite(Number(amount)) || Number(amount) <= 0} variant="outlined" onClick={() => run(async () => {
                await createBookInvoice(patientId, Number(amount));
                await refreshBooks();
                setAmount("");
            })}>Lập hóa đơn sổ</Button>
            <TextField size="small" label="Số sổ mới" value={newBookNumber} disabled={busy || !recordsLoaded}
                onChange={event => setNewBookNumber(event.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} sx={{ gridColumn: { sm: "1 / -1" } }} />
        </Box>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
            {invoices.map(invoice => <Stack key={invoice.bookInvoiceId} role="group" aria-label={`Hóa đơn sổ #${invoice.bookInvoiceId}`} direction={{ xs: "column", sm: "row" }} spacing={1}
                sx={{ alignItems: { xs: "flex-start", sm: "center" }, pb: 1.5, borderBottom: "1px solid", borderColor: colors.borderSoft }}>
                <Box sx={{ flex: 1 }}>
                    <Typography className="appointment-numeric" sx={{ fontSize: 14, fontWeight: 600, color: colors.heading }}>#{invoice.bookInvoiceId}: {invoice.amount.toLocaleString("vi-VN")} ₫</Typography>
                    <Chip size="small" variant="outlined" color={invoice.status === "Paid" ? "success" : "warning"} label={invoice.status === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"} sx={{ mt: 0.75 }} />
                </Box>
                {invoice.status === "Unpaid" && <Button size="small" sx={appointmentButtonSx} disabled={busy || !recordsLoaded || !paymentReceived}
                    onClick={() => run(async () => {
                        await markBookInvoicePaid(invoice.bookInvoiceId);
                        await refreshBooks();
                        setPaymentReceived(false);
                    })}>Ghi Paid</Button>}
                {readyInvoices.some(ready => ready.bookInvoiceId === invoice.bookInvoiceId) && <Button size="small" variant="contained" sx={appointmentPrimaryButtonSx}
                    disabled={busy || !recordsLoaded || !newBookNumber.trim()} onClick={() => run(async () => {
                        const book = await issueBook(invoice.bookInvoiceId, newBookNumber.trim());
                        await refreshBooks();
                        onIssued(book);
                        setNewBookNumber("");
                    })}>Phát / cấp lại sổ</Button>}
            </Stack>)}
        </Stack>
        <FormControlLabel sx={{ mt: 1, alignItems: "flex-start", "& .MuiFormControlLabel-label": { fontSize: 14, pt: 1 } }}
            control={<Checkbox checked={paymentReceived} disabled={busy || !recordsLoaded || !invoices.some(invoice => invoice.status === "Unpaid")}
                onChange={event => setPaymentReceived(event.target.checked)} />} label="Đã nhận thanh toán thực tế cho hóa đơn sổ" />
    </Box>;
}
