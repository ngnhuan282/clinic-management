import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { checkInAppointment, createBookInvoice, findPatientMatches, getBookInvoices, getPatientBooks, issueBook, markBookInvoicePaid, matchAppointmentPatient, registerExistingBook } from "../../api/receptionApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useNotifications from "../../hooks/useNotifications";

export default function ReceptionCheckInDialog({ appointment, onClose, onCheckedIn }) {
    const { revision } = useNotifications();
    const [linkedPatientId, setPatientId] = useState(null);
    const patientId = appointment?.patientProfileId || linkedPatientId;
    const [matches, setMatches] = useState([]);
    const [matchesSearched, setMatchesSearched] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [bookRecords, setBooks] = useState([]);
    const [invoiceRecords, setInvoices] = useState([]);
    const [loadedPatientId, setLoadedPatientId] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const recordRequest = useRef(0);
    const [bookId, setBookId] = useState("");
    const [existingBookNumber, setExistingBookNumber] = useState("");
    const [newBookNumber, setNewBookNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [checkedBookKey, setCheckedBookKey] = useState("");
    const [situation, setSituation] = useState(null);
    const [paymentReceived, setPaymentReceived] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const refreshBooks = useCallback(async () => {
        if (!patientId) return;
        const requestId = ++recordRequest.current;
        setRecordsLoading(true);
        try {
            const [bookList, invoiceList] = await Promise.all([getPatientBooks(patientId), getBookInvoices(patientId)]);
            if (requestId !== recordRequest.current) return;
            setBooks(bookList);
            setInvoices(invoiceList);
            setLoadedPatientId(patientId);
            setError("");
            setBookId(current => current && !bookList.some(book => book.patientBookId === Number(current) && book.status === "Issued") ? "" : current);
        } catch (err) {
            if (requestId === recordRequest.current) {
                setLoadedPatientId(null);
                setError(getApiErrorMessage(err));
            }
            throw err;
        } finally { if (requestId === recordRequest.current) setRecordsLoading(false); }
    }, [patientId]);

    useEffect(() => {
        if (!patientId) return;
        const timer = setTimeout(() => { void refreshBooks().catch(() => {}); }, 0);
        return () => { clearTimeout(timer); recordRequest.current += 1; };
    }, [patientId, revision, refreshBooks]);

    async function run(action) {
        setBusy(true);
        setError("");
        try { await action(); }
        catch (err) { setError(getApiErrorMessage(err)); }
        finally { setBusy(false); }
    }

    const recordsLoaded = loadedPatientId === patientId && !recordsLoading;
    const books = loadedPatientId === patientId ? bookRecords : [];
    const invoices = loadedPatientId === patientId ? invoiceRecords : [];
    const selectedBook = recordsLoaded ? books.find(book => book.patientBookId === Number(bookId) && book.status === "Issued" && book.patientId === patientId) : null;
    const selectedInvoice = selectedBook?.bookInvoiceId ? invoices.find(invoice => invoice.bookInvoiceId === selectedBook.bookInvoiceId) : null;
    const bookPaid = Boolean(selectedBook && (!selectedBook.bookInvoiceId || selectedInvoice?.status === "Paid"));
    const bookSituation = situation?.patientId === patientId ? situation.value : (books.some(book => book.patientId === patientId && book.status === "Issued") ? "present" : "none");
    const currentBookKey = selectedBook ? `${patientId}:${selectedBook.patientBookId}:${selectedBook.bookNumber}` : `external:${patientId}:${existingBookNumber.trim()}`;
    const presented = checkedBookKey === currentBookKey && Boolean(selectedBook || existingBookNumber.trim());
    const readyInvoices = invoices.filter(invoice => invoice.status === "Paid"
        && (!books.some(book => book.bookInvoiceId === invoice.bookInvoiceId)
            || books.some(book => book.bookInvoiceId === invoice.bookInvoiceId && book.status === "Pending")));
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    const canCheckIn = appointment.status === "Confirmed" && !appointment.checkedInAt
        && appointment.appointmentDate.slice(0, 10) === today
        && recordsLoaded && bookSituation === "present" && bookPaid && presented;

    return <Dialog open={Boolean(appointment)} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>Tiếp nhận và kiểm tra sổ khám</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography variant="body2">{appointment.patientName} · {appointment.patientPhone}</Typography>
                {appointment.checkedInAt && <Alert severity="success">Lịch hẹn này đã được check-in.</Alert>}
                {appointment.status !== "Confirmed" && <Alert severity="warning">Trạng thái lịch hẹn hiện tại không cho phép check-in.</Alert>}
                <Alert severity="info">Đặt lịch trên web chưa cần sổ khám. Khi đến quầy, đối chiếu hồ sơ và kiểm tra sổ trước khi check-in.</Alert>
                {error && <Alert severity="error" action={patientId && <Button disabled={busy} onClick={() => run(refreshBooks)}>Tải lại</Button>}>{error}</Alert>}
                {!patientId ? <>
                    <Typography variant="body2">Đối chiếu hồ sơ bệnh nhân theo tên và số điện thoại trước khi check-in.</Typography>
                    <Button disabled={busy} variant="outlined" onClick={() => run(async () => {
                        setMatches(await findPatientMatches(appointment.patientPhone));
                        setMatchesSearched(true);
                    })}>{busy ? "Đang tìm..." : "Tìm hồ sơ cũ"}</Button>
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
                        })}>Liên kết hồ sơ cũ</Button>
                        <Button disabled={busy} variant="outlined" onClick={() => run(async () => {
                            const updated = await matchAppointmentPatient(appointment.appointmentId, null);
                            setPatientId(updated.patientProfileId);
                        })}>Tạo hồ sơ mới</Button>
                    </Stack>
                </> : <>
                    <Typography variant="body2">Hồ sơ bệnh nhân #{patientId}</Typography>
                    {!recordsLoaded && <Typography variant="body2" color="text.secondary">Đang tải sổ khám và hóa đơn...</Typography>}
                    <Box>
                        <FormLabel id="book-situation-label">Tình trạng sổ khi đến quầy</FormLabel>
                        <RadioGroup aria-labelledby="book-situation-label" value={bookSituation} onChange={event => {
                            setSituation({ patientId, value: event.target.value });
                            setBookId("");
                            setCheckedBookKey("");
                        }}>
                            {[ ["present", "Có sổ mang theo"], ["none", "Chưa có sổ"], ["lost", "Mất sổ"], ["forgot", "Quên sổ"] ].map(([value, label]) =>
                                <FormControlLabel key={value} value={value} control={<Radio disabled={busy || !recordsLoaded} />} label={label} />)}
                        </RadioGroup>
                    </Box>
                    {bookSituation !== "present" && <Alert severity="warning">
                        {bookSituation === "none" ? "Bệnh nhân chưa có sổ." : bookSituation === "lost" ? "Bệnh nhân báo mất sổ." : "Bệnh nhân quên mang sổ."}
                        {" Lập hóa đơn sổ, xác nhận thanh toán rồi phát hoặc cấp lại sổ. Chỉ check-in sau khi đã kiểm tra sổ mới."}
                    </Alert>}
                    {recordsLoaded && books.length === 0 && <Typography variant="body2" color="text.secondary">Chưa có sổ khám. Ghi nhận sổ cũ mang theo hoặc cấp sổ mới sau thanh toán.</Typography>}
                    {bookSituation === "present" && <>
                    <TextField select label="Sổ khám còn hiệu lực" value={selectedBook ? bookId : ""} disabled={busy || !recordsLoaded} onChange={event => {
                        setBookId(event.target.value);
                        setCheckedBookKey("");
                    }}>
                        <MenuItem value="">Chọn sổ đã kiểm tra</MenuItem>
                        {books.filter(book => book.status === "Issued").map(book =>
                            <MenuItem key={book.patientBookId} value={book.patientBookId}>
                                {book.bookNumber} {book.bookInvoiceId ? "· Cấp sau thanh toán" : "· Sổ cũ"}
                            </MenuItem>)}
                    </TextField>
                    {selectedBook && !bookPaid && <Alert severity="warning">Hóa đơn của sổ chưa được xác nhận thanh toán. Chưa thể check-in.</Alert>}
                    {!selectedBook && <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                        <Typography variant="subtitle2">Bệnh nhân mang sổ cũ chưa có trong hệ thống</Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                            <TextField size="small" label="Số sổ mang theo" value={existingBookNumber}
                                disabled={busy || !recordsLoaded} onChange={event => { setExistingBookNumber(event.target.value); setCheckedBookKey(""); }} slotProps={{ htmlInput: { maxLength: 40 } }} />
                            <Button disabled={busy || !recordsLoaded || !existingBookNumber.trim() || !presented} variant="outlined"
                                onClick={() => run(async () => {
                                    const book = await registerExistingBook(patientId, existingBookNumber.trim());
                                    await refreshBooks();
                                    setBookId(book.patientBookId);
                                    setCheckedBookKey(`${patientId}:${book.patientBookId}:${book.bookNumber}`);
                                    setExistingBookNumber("");
                                })}>Ghi nhận sổ cũ</Button>
                        </Stack>
                    </Box>}
                    <FormControlLabel control={<Checkbox checked={presented} disabled={busy || !recordsLoaded || (!selectedBook && !existingBookNumber.trim())}
                        onChange={event => setCheckedBookKey(event.target.checked ? currentBookKey : "")} />}
                        label="Đã kiểm tra sổ bệnh nhân mang theo" />
                    </>}
                    <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                        <Typography variant="subtitle2">Phát hoặc cấp lại sổ sau thanh toán</Typography>
                        {readyInvoices.length > 0 && <Alert severity="success" sx={{ mt: 1 }}>
                            Hóa đơn {readyInvoices.map(invoice => `#${invoice.bookInvoiceId}`).join(", ")} đã thanh toán.
                            Nhập số sổ để phát hoặc cấp lại sổ cho bệnh nhân.
                            {books.some(book => book.status === "Issued") && " Cấp lại sẽ ngừng hiệu lực sổ cũ."}
                        </Alert>}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                            <TextField size="small" label="Phí sổ khám (VNĐ)" type="number" value={amount} disabled={busy || !recordsLoaded}
                                onChange={event => setAmount(event.target.value)} />
                            <TextField size="small" label="Số sổ mới" value={newBookNumber} disabled={busy || !recordsLoaded}
                                onChange={event => setNewBookNumber(event.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} />
                            <Button disabled={busy || !recordsLoaded || !Number.isFinite(Number(amount)) || Number(amount) <= 0} variant="outlined" onClick={() => run(async () => {
                                await createBookInvoice(patientId, Number(amount));
                                await refreshBooks();
                                setAmount("");
                            })}>Lập hóa đơn sổ</Button>
                        </Stack>
                        {invoices.map(invoice => <Stack key={invoice.bookInvoiceId} direction={{ xs: "column", sm: "row" }}
                            spacing={1} sx={{ mt: 1, alignItems: { sm: "center" } }}>
                            <Typography variant="body2">#{invoice.bookInvoiceId} · {invoice.amount.toLocaleString("vi-VN")} ₫ · {invoice.status}</Typography>
                            {invoice.status === "Unpaid" && <Button size="small" disabled={busy || !recordsLoaded || !paymentReceived}
                                onClick={() => run(async () => {
                                    await markBookInvoicePaid(invoice.bookInvoiceId);
                                    await refreshBooks();
                                    setPaymentReceived(false);
                                })}>Ghi Paid</Button>}
                            {readyInvoices.some(ready => ready.bookInvoiceId === invoice.bookInvoiceId) &&
                                <Button size="small" disabled={busy || !recordsLoaded || !newBookNumber.trim()} onClick={() => run(async () => {
                                    const book = await issueBook(invoice.bookInvoiceId, newBookNumber.trim());
                                    await refreshBooks();
                                    setBookId(book.patientBookId);
                                    setSituation({ patientId, value: "present" });
                                    setCheckedBookKey("");
                                    setNewBookNumber("");
                                })}>Phát / cấp lại sổ</Button>}
                        </Stack>)}
                        <FormControlLabel control={<Checkbox checked={paymentReceived} disabled={busy || !recordsLoaded}
                            onChange={event => setPaymentReceived(event.target.checked)} />}
                            label="Đã nhận thanh toán thực tế cho hóa đơn sổ" />
                    </Box>
                    {!canCheckIn && recordsLoaded && <Alert severity="info">Chưa thể check-in: cần sổ còn hiệu lực, hóa đơn sổ đã thanh toán nếu có, và xác nhận kiểm tra sổ thực tế.</Alert>}
                </>}
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button disabled={busy} onClick={onClose}>Đóng</Button>
            <Button variant="contained" disabled={busy || !canCheckIn}
                onClick={() => run(async () => {
                    await checkInAppointment(appointment.appointmentId, {
                        patientProfileId: patientId, patientBookId: Number(bookId), bookPresented: presented,
                    });
                    onCheckedIn();
                })}>Check-in</Button>
        </DialogActions>
    </Dialog>;
}
