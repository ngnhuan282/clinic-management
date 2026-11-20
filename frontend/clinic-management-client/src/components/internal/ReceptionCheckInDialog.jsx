import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { checkInAppointment, createBookRequest, findPatientMatches, getBookInvoices, getPatientBookRequests, getPatientBooks, getPatientProfile, issueBook, matchAppointmentPatient, registerExistingBook, updatePatientProfile } from "../../api/receptionApi";
import { CloseRounded, EditRounded, FactCheckOutlined, PersonOutlineRounded, SaveRounded } from "@mui/icons-material";
import { useClinicInfo } from "../../api/publicApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { toPatientProfileForm, toPatientProfilePayload, validatePatientProfileForm } from "../../utils/patientProfileForm";
import useNotifications from "../../hooks/useNotifications";
import {
    clinicColors,
    clinicDialogPaperSx,
} from "../common/clinicUi";

function formatTime(value) {
    return String(value || "").slice(0, 5);
}

export default function ReceptionCheckInDialog({ appointment, onClose, onCheckedIn }) {
    const { revision } = useNotifications();
    const clinic = useClinicInfo();
    const [linkedPatientId, setPatientId] = useState(null);
    const patientId = appointment?.patientProfileId || linkedPatientId;
    const [matches, setMatches] = useState([]);
    const [matchesSearched, setMatchesSearched] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [bookRecords, setBooks] = useState([]);
    const [invoiceRecords, setInvoices] = useState([]);
    const [bookRequests, setBookRequests] = useState([]);
    const [loadedPatientId, setLoadedPatientId] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const recordRequest = useRef(0);
    const [bookId, setBookId] = useState("");
    const [existingBookNumber, setExistingBookNumber] = useState("");
    const [newBookNumber, setNewBookNumber] = useState("");
    const [checkedBookKey, setCheckedBookKey] = useState("");
    const [situation, setSituation] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState(null);
    const [profileErrors, setProfileErrors] = useState({});
    const [profileBusy, setProfileBusy] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSaved, setProfileSaved] = useState(false);

    const refreshBooks = useCallback(async () => {
        if (!patientId) return;
        const requestId = ++recordRequest.current;
        setRecordsLoading(true);
        try {
            const [bookList, invoiceList, requestList] = await Promise.all([
                getPatientBooks(patientId),
                getBookInvoices(patientId),
                getPatientBookRequests(patientId),
            ]);
            if (requestId !== recordRequest.current) return;
            setBooks(bookList);
            setInvoices(invoiceList);
            setBookRequests(requestList.items);
            setLoadedPatientId(patientId);
            setError("");
            setBookId(current =>
                current && !bookList.some(book => book.patientBookId === Number(current) && book.status === "Issued")
                    ? ""
                    : current
            );
        } catch (err) {
            if (requestId === recordRequest.current) {
                setLoadedPatientId(null);
                setError(getApiErrorMessage(err));
            }
            throw err;
        } finally {
            if (requestId === recordRequest.current) setRecordsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (!patientId) return;
        const timer = setTimeout(() => {
            void refreshBooks().catch(() => {});
        }, 0);
        return () => {
            clearTimeout(timer);
            recordRequest.current += 1;
        };
    }, [patientId, revision, refreshBooks]);

    async function run(action) {
        setBusy(true);
        setError("");
        try {
            await action();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    async function openProfileEdit() {
        setProfileBusy(true);
        setProfileError("");
        try {
            const profile = await getPatientProfile(patientId);
            setProfileForm(toPatientProfileForm(profile));
            setProfileErrors({});
            setProfileSaved(false);
            setEditingProfile(true);
        } catch (err) {
            setProfileError(getApiErrorMessage(err));
        } finally {
            setProfileBusy(false);
        }
    }

    async function saveProfile() {
        const errors = validatePatientProfileForm(profileForm);
        setProfileErrors(errors);
        if (Object.keys(errors).length > 0) return;
        setProfileBusy(true);
        setProfileError("");
        try {
            await updatePatientProfile(patientId, toPatientProfilePayload(profileForm));
            setProfileSaved(true);
            setEditingProfile(false);
        } catch (err) {
            setProfileError(getApiErrorMessage(err));
        } finally {
            setProfileBusy(false);
        }
    }

    const recordsLoaded = loadedPatientId === patientId && !recordsLoading;
    const books = loadedPatientId === patientId ? bookRecords : [];
    const invoices = loadedPatientId === patientId ? invoiceRecords : [];
    const hasOpenBookRequest = bookRequests.some(request => request.status !== "Issued");
    const selectedBook = recordsLoaded
        ? books.find(book => book.patientBookId === Number(bookId) && book.status === "Issued" && book.patientId === patientId)
        : null;
    const selectedInvoice = selectedBook?.bookInvoiceId
        ? invoices.find(invoice => invoice.bookInvoiceId === selectedBook.bookInvoiceId)
        : null;
    const bookPaid = Boolean(selectedBook && (!selectedBook.bookInvoiceId || selectedInvoice?.status === "Paid"));
    const bookSituation =
        situation?.patientId === patientId
            ? situation.value
            : books.some(book => book.patientId === patientId && book.status === "Issued")
            ? "present"
            : "none";
    const currentBookKey = selectedBook
        ? `${patientId}:${selectedBook.patientBookId}:${selectedBook.bookNumber}`
        : `external:${patientId}:${existingBookNumber.trim()}`;
    const presented = checkedBookKey === currentBookKey && Boolean(selectedBook || existingBookNumber.trim());
    const readyInvoices = invoices.filter(
        invoice =>
            invoice.status === "Paid" &&
            (!books.some(book => book.bookInvoiceId === invoice.bookInvoiceId) ||
                books.some(book => book.bookInvoiceId === invoice.bookInvoiceId && book.status === "Pending"))
    );
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    const appointmentValidToday =
        appointment.status === "Confirmed" &&
        !appointment.checkedInAt &&
        appointment.appointmentDate.slice(0, 10) === today;
    const hasValidPaidBook = Boolean(recordsLoaded && bookSituation === "present" && bookPaid);
    const canCheckIn = appointmentValidToday && Boolean(patientId) && hasValidPaidBook && presented;

    return (
        <Dialog
            open={Boolean(appointment)}
            onClose={busy ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        ...clinicDialogPaperSx,
                        m: { xs: 1.25, sm: 2 },
                        width: { xs: "calc(100% - 20px)", sm: "100%" },
                    },
                },
            }}
        >
            <DialogTitle sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.75, borderBottom: `1px solid ${clinicColors.border}`, bgcolor: "#F8FBFF" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: "11px",
                                bgcolor: "#0B4F8A",
                                color: "#FFFFFF",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <FactCheckOutlined sx={{ fontSize: 22 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: { xs: 17.5, sm: 19 }, fontWeight: 800, color: clinicColors.heading, lineHeight: 1.25 }}>
                                Tiếp nhận và kiểm tra sổ khám
                            </Typography>
                            <Stack direction="row" spacing={0.75} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.4 }}>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0B4F8A", overflowWrap: "anywhere" }}>
                                    {appointment.patientName} · {appointment.patientPhone}
                                </Typography>
                                {appointment.startTime && (
                                    <Chip
                                        size="small"
                                        label={`${formatTime(appointment.startTime)} · ${appointment.doctorName || "Bác sĩ"}`}
                                        sx={{ height: 22, fontSize: 11.5, fontWeight: 700, bgcolor: "#E6F0FA", color: "#0A2540" }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
            </DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ pt: 2 }}>
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
                    <Box sx={{ border: "1px solid #D8E4F0", borderRadius: "12px", bgcolor: "#F8FBFF", p: 2 }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#E6F0FA", color: clinicColors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                    <PersonOutlineRounded sx={{ fontSize: 22 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>Hồ sơ bệnh nhân</Typography>
                                    <Typography sx={{ fontSize: 12.5, color: clinicColors.muted }}>Mã hồ sơ #{patientId}</Typography>
                                </Box>
                            </Stack>
                            <Button size="small" variant="outlined" disabled={profileBusy}
                                startIcon={editingProfile ? <CloseRounded /> : <EditRounded />}
                                onClick={() => (editingProfile ? setEditingProfile(false) : openProfileEdit())}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, flexShrink: 0, bgcolor: "#fff" }}>
                                {editingProfile ? "Đóng" : "Sửa hồ sơ"}
                            </Button>
                        </Stack>
                        {profileSaved && !editingProfile && <Alert severity="success" sx={{ mt: 1.5, borderRadius: "10px" }}>Đã lưu hồ sơ bệnh nhân.</Alert>}
                        {profileError && <Alert severity="error" sx={{ mt: 1.5, borderRadius: "10px" }}>{profileError}</Alert>}
                        {editingProfile && profileForm && <Box component="form" noValidate
                            onSubmit={event => { event.preventDefault(); saveProfile(); }}
                            sx={{ mt: 2, pt: 2, borderTop: "1px solid #D8E4F0" }}>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}>
                                <TextField required size="small" label="Họ và tên" value={profileForm.fullName} disabled={profileBusy}
                                    error={Boolean(profileErrors.fullName)} helperText={profileErrors.fullName}
                                    onChange={event => setProfileForm(current => ({ ...current, fullName: event.target.value }))}
                                    slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ gridColumn: { sm: "1 / -1" } }} />
                                <TextField required size="small" type="tel" label="Số điện thoại" value={profileForm.phone} disabled={profileBusy}
                                    error={Boolean(profileErrors.phone)} helperText={profileErrors.phone}
                                    onChange={event => setProfileForm(current => ({ ...current, phone: event.target.value }))}
                                    slotProps={{ htmlInput: { maxLength: 15 } }} />
                                <TextField size="small" type="date" label="Ngày sinh" value={profileForm.birthDate} disabled={profileBusy}
                                    onChange={event => setProfileForm(current => ({ ...current, birthDate: event.target.value }))}
                                    slotProps={{ inputLabel: { shrink: true } }} />
                                <TextField size="small" label="Số CCCD / CMND" value={profileForm.identityNumber} disabled={profileBusy}
                                    error={Boolean(profileErrors.identityNumber)} helperText={profileErrors.identityNumber}
                                    onChange={event => setProfileForm(current => ({ ...current, identityNumber: event.target.value }))}
                                    slotProps={{ htmlInput: { maxLength: 20 } }} />
                                <TextField size="small" label="Mã thẻ Bảo hiểm y tế" value={profileForm.insuranceCode} disabled={profileBusy}
                                    error={Boolean(profileErrors.insuranceCode)} helperText={profileErrors.insuranceCode}
                                    onChange={event => setProfileForm(current => ({ ...current, insuranceCode: event.target.value }))}
                                    slotProps={{ htmlInput: { maxLength: 30 } }} />
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                                <Button disabled={profileBusy} onClick={() => setEditingProfile(false)} sx={{ textTransform: "none", fontWeight: 650 }}>Hủy</Button>
                                <Button type="submit" variant="contained" disabled={profileBusy} startIcon={<SaveRounded />}
                                    sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>
                                    {profileBusy ? "Đang lưu..." : "Lưu hồ sơ"}
                                </Button>
                            </Stack>
                        </Box>}
                    </Box>
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
                        {` Tạo yêu cầu mua/cấp lại sổ (phí sổ cấu hình: ${clinic.patientBookFee.toLocaleString("vi-VN")} ₫) và hướng dẫn bệnh nhân sang Thu ngân thanh toán. Phát sổ khi nhận được xác nhận Paid.`}
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
                            <TextField size="small" label="Số sổ mới" value={newBookNumber} disabled={busy || !recordsLoaded}
                                onChange={event => setNewBookNumber(event.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} />
                            <Button disabled={busy || !recordsLoaded || bookSituation === "present" || hasOpenBookRequest} variant="outlined" onClick={() => run(async () => {
                                await createBookRequest(patientId, { none: "New", lost: "Lost", forgot: "Forgot" }[bookSituation]);
                                await refreshBooks();
                            })}>Yêu cầu mua / cấp lại sổ</Button>
                        </Stack>
                        {recordsLoaded && bookRequests.map(request => <Alert key={request.patientBookRequestId} severity="info" sx={{ mt: 1 }}>
                            Yêu cầu #{request.patientBookRequestId} · {request.status === "Pending" ? "Đã ghi nhận yêu cầu mua/cấp lại sổ. Theo dõi xác nhận thanh toán bên dưới" : request.status === "Unpaid" ? "Chờ thanh toán tại Thu ngân" : request.status === "Issued" ? "Đã phát sổ" : "Đã thanh toán, có thể phát sổ"}.
                            {" Hồ sơ và lịch sử khám của bệnh nhân được giữ nguyên."}
                        </Alert>)}
                        {invoices.map(invoice => <Stack key={invoice.bookInvoiceId} direction={{ xs: "column", sm: "row" }}
                            spacing={1} sx={{ mt: 1, alignItems: { sm: "center" } }}>
                            <Typography variant="body2">#{invoice.bookInvoiceId} · {invoice.amount.toLocaleString("vi-VN")} ₫ · {invoice.status}</Typography>
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
                        {selectedBook?.issuedByUserId && <Typography variant="caption">
                            Người cấp: #{selectedBook.issuedByUserId} · {new Date(selectedBook.issuedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                        </Typography>}
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
    </Dialog>
    );
}
