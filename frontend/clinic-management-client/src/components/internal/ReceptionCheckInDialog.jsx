import { useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { checkInAppointment, createBookInvoice, findPatientMatches, getBookInvoices, getPatientBooks, issueBook, markBookInvoicePaid, matchAppointmentPatient, registerExistingBook } from "../../api/receptionApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useNotifications from "../../hooks/useNotifications";

export default function ReceptionCheckInDialog({ appointment, onClose, onCheckedIn }) {
    const { revision } = useNotifications();
    const [patientId, setPatientId] = useState(appointment?.patientProfileId || null);
    const [matches, setMatches] = useState([]);
    const [matchesSearched, setMatchesSearched] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [books, setBooks] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [recordsLoaded, setRecordsLoaded] = useState(false);
    const [bookId, setBookId] = useState("");
    const [existingBookNumber, setExistingBookNumber] = useState("");
    const [newBookNumber, setNewBookNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [presented, setPresented] = useState(false);
    const [paymentReceived, setPaymentReceived] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!patientId) return;
        let active = true;
        Promise.all([getPatientBooks(patientId), getBookInvoices(patientId)])
            .then(([bookList, invoiceList]) => {
                if (active) {
                    setBooks(bookList);
                    setInvoices(invoiceList);
                }
            })
            .catch(err => { if (active) setError(getApiErrorMessage(err)); })
            .finally(() => { if (active) setRecordsLoaded(true); });
        return () => { active = false; };
    }, [patientId, revision]);

    async function run(action) {
        setBusy(true);
        setError("");
        try { await action(); }
        catch (err) { setError(getApiErrorMessage(err)); }
        finally { setBusy(false); }
    }

    async function refreshBooks() {
        setBooks(await getPatientBooks(patientId));
        setInvoices(await getBookInvoices(patientId));
    }

    const selectedBook = books.find(book => book.patientBookId === Number(bookId));

    return <Dialog open={Boolean(appointment)} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>Tiếp nhận và kiểm tra sổ khám</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography variant="body2">{appointment.patientName} · {appointment.patientPhone}</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {!patientId ? <>
                    <Typography variant="body2">Đối chiếu hồ sơ Patient theo tên và số điện thoại trước khi check-in.</Typography>
                    <Button disabled={busy} variant="outlined" onClick={() => run(async () => {
                        setMatches(await findPatientMatches(appointment.patientPhone));
                        setMatchesSearched(true);
                    })}>{busy ? "Đang tìm..." : "Tìm Patient cũ"}</Button>
                    {matchesSearched && !matches.length && <Typography variant="body2" color="text.secondary">Không tìm thấy hồ sơ theo số điện thoại này.</Typography>}
                    {matches.length > 0 && <TextField select label="Hồ sơ trùng khớp" value={selectedPatientId}
                        onChange={event => setSelectedPatientId(event.target.value)}>
                        <MenuItem value="">Chọn hồ sơ</MenuItem>
                        {matches.map(patient => <MenuItem key={patient.patientId} value={patient.patientId}>
                            #{patient.patientId} · {patient.fullName} · {patient.phone}
                        </MenuItem>)}
                    </TextField>}
                    <Stack direction="row" spacing={1}>
                        <Button disabled={busy || !selectedPatientId} variant="contained" onClick={() => run(async () => {
                            const updated = await matchAppointmentPatient(appointment.appointmentId, Number(selectedPatientId));
                            setPatientId(updated.patientProfileId);
                        })}>Liên kết Patient cũ</Button>
                        <Button disabled={busy} variant="outlined" onClick={() => run(async () => {
                            const updated = await matchAppointmentPatient(appointment.appointmentId, null);
                            setPatientId(updated.patientProfileId);
                        })}>Tạo hồ sơ mới</Button>
                    </Stack>
                </> : <>
                    <Typography variant="body2">Hồ sơ Patient #{patientId}</Typography>
                    {!recordsLoaded && <Typography variant="body2" color="text.secondary">Đang tải sổ khám và hóa đơn...</Typography>}
                    {recordsLoaded && books.length === 0 && <Typography variant="body2" color="text.secondary">Chưa có sổ khám. Ghi nhận sổ cũ mang theo hoặc cấp sổ mới sau thanh toán.</Typography>}
                    <TextField select label="Sổ khám Issued" value={bookId} onChange={event => {
                        setBookId(event.target.value);
                        setPresented(false);
                    }}>
                        <MenuItem value="">Chọn sổ đã kiểm tra</MenuItem>
                        {books.filter(book => book.status === "Issued").map(book =>
                            <MenuItem key={book.patientBookId} value={book.patientBookId}>
                                {book.bookNumber} {book.bookInvoiceId ? "· Cấp sau thanh toán" : "· Sổ cũ"}
                            </MenuItem>)}
                    </TextField>
                    <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                        <Typography variant="subtitle2">Bệnh nhân mang sổ cũ chưa có trong hệ thống</Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                            <TextField size="small" label="Số sổ mang theo" value={existingBookNumber}
                                onChange={event => setExistingBookNumber(event.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} />
                            <Button disabled={busy || !existingBookNumber.trim() || !presented} variant="outlined"
                                onClick={() => run(async () => {
                                    const book = await registerExistingBook(patientId, existingBookNumber.trim());
                                    await refreshBooks();
                                    setBookId(book.patientBookId);
                                    setExistingBookNumber("");
                                })}>Ghi nhận sổ cũ</Button>
                        </Stack>
                        <FormControlLabel control={<Checkbox checked={presented}
                            onChange={event => setPresented(event.target.checked)} />}
                            label="Đã kiểm tra sổ bệnh nhân mang theo" />
                    </Box>
                    <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                        <Typography variant="subtitle2">Cấp sổ mới sau Invoice Book Paid</Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                            <TextField size="small" label="Phí sổ khám (VNĐ)" type="number" value={amount}
                                onChange={event => setAmount(event.target.value)} />
                            <TextField size="small" label="Số sổ mới" value={newBookNumber}
                                onChange={event => setNewBookNumber(event.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} />
                            <Button disabled={busy || Number(amount) <= 0} variant="outlined" onClick={() => run(async () => {
                                const invoice = await createBookInvoice(patientId, Number(amount));
                                setInvoices(current => [invoice, ...current]);
                                setAmount("");
                            })}>Lập hóa đơn sổ</Button>
                        </Stack>
                        {invoices.map(invoice => <Stack key={invoice.bookInvoiceId} direction={{ xs: "column", sm: "row" }}
                            spacing={1} sx={{ mt: 1, alignItems: { sm: "center" } }}>
                            <Typography variant="body2">#{invoice.bookInvoiceId} · {invoice.amount.toLocaleString("vi-VN")} ₫ · {invoice.status}</Typography>
                            {invoice.status === "Unpaid" && <Button size="small" disabled={busy || !paymentReceived}
                                onClick={() => run(async () => {
                                    await markBookInvoicePaid(invoice.bookInvoiceId);
                                    await refreshBooks();
                                    setPaymentReceived(false);
                                })}>Ghi Paid</Button>}
                            {invoice.status === "Paid" && !books.some(book => book.bookInvoiceId === invoice.bookInvoiceId) &&
                                <Button size="small" disabled={busy || !newBookNumber.trim()} onClick={() => run(async () => {
                                    const book = await issueBook(invoice.bookInvoiceId, newBookNumber.trim());
                                    await refreshBooks();
                                    setBookId(book.patientBookId);
                                    setNewBookNumber("");
                                })}>Cấp sổ mới</Button>}
                        </Stack>)}
                        <FormControlLabel control={<Checkbox checked={paymentReceived}
                            onChange={event => setPaymentReceived(event.target.checked)} />}
                            label="Đã nhận thanh toán thực tế cho hóa đơn sổ" />
                    </Box>
                </>}
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button disabled={busy} onClick={onClose}>Đóng</Button>
            <Button variant="contained" disabled={busy || !patientId || !bookId ||
                (selectedBook && !selectedBook.bookInvoiceId && !presented)}
                onClick={() => run(async () => {
                    await checkInAppointment(appointment.appointmentId, {
                        patientProfileId: patientId, patientBookId: Number(bookId), bookPresented: presented,
                    });
                    onCheckedIn();
                })}>Check-in</Button>
        </DialogActions>
    </Dialog>;
}
