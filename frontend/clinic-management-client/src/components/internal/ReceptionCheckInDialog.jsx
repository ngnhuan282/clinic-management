import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormLabel,
    IconButton,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AssignmentTurnedInOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    FactCheckOutlined,
    MenuBookOutlined,
    PersonSearchOutlined,
    RadioButtonUncheckedOutlined,
} from "@mui/icons-material";
import {
    checkInAppointment,
    createBookRequest,
    findPatientMatches,
    getBookInvoices,
    getPatientBookRequests,
    getPatientBooks,
    issueBook,
    matchAppointmentPatient,
    registerExistingBook,
} from "../../api/receptionApi";
import { useClinicInfo } from "../../api/publicApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useNotifications from "../../hooks/useNotifications";
import {
    clinicButtonSx,
    clinicColors,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
} from "../common/clinicUi";

const SITUATION_OPTIONS = [
    ["present", "Có sổ mang theo"],
    ["none", "Chưa có sổ"],
    ["lost", "Mất sổ"],
    ["forgot", "Quên sổ"],
];

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

    const checklistItems = [
        ["Lịch hẹn Đã xác nhận & đúng ngày hôm nay", appointmentValidToday],
        ["Đã đối chiếu & gắn hồ sơ bệnh nhân", Boolean(patientId)],
        ["Đã chọn sổ khám còn hiệu lực (Paid nếu cấp mới)", hasValidPaidBook],
        ["Đã tích xác nhận kiểm tra sổ thực tế mang theo", Boolean(bookSituation === "present" && presented)],
    ];

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
                    <IconButton aria-label="Đóng hộp thoại tiếp nhận" size="small" disabled={busy} onClick={onClose}>
                        <CloseOutlined fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2}>
                    {appointment.checkedInAt && <Alert severity="success">Lịch hẹn này đã được check-in.</Alert>}
                    {appointment.status !== "Confirmed" && (
                        <Alert severity="warning">Trạng thái lịch hẹn hiện tại không cho phép check-in.</Alert>
                    )}
                    {error && (
                        <Alert
                            severity="error"
                            action={
                                patientId && (
                                    <Button color="inherit" size="small" disabled={busy} onClick={() => run(refreshBooks)}>
                                        Tải lại
                                    </Button>
                                )
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* STEP 1: PATIENT PROFILE MATCHING */}
                    {!patientId ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: "12px",
                                borderColor: "#0B4F8A",
                                borderLeft: "4px solid #0B4F8A",
                                bgcolor: "#FFFFFF",
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <PersonSearchOutlined sx={{ color: "#0B4F8A", fontSize: 20 }} />
                                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#0A2540" }}>
                                            Bước 1/3 · Đối chiếu hồ sơ bệnh nhân
                                        </Typography>
                                    </Stack>
                                    <Chip
                                        size="small"
                                        label="Cần thực hiện trước"
                                        sx={{ bgcolor: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D", fontWeight: 750 }}
                                    />
                                </Stack>

                                <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.55 }}>
                                    Tìm theo số điện thoại <strong>{appointment.patientPhone}</strong> để gắn vào hồ sơ cũ (giữ lịch sử khám), hoặc tạo mới nếu bệnh nhân đến khám lần đầu.
                                </Typography>

                                <Box>
                                    <Button
                                        disabled={busy}
                                        variant="outlined"
                                        size="small"
                                        sx={clinicSecondaryButtonSx}
                                        onClick={() =>
                                            run(async () => {
                                                setMatches(await findPatientMatches(appointment.patientPhone));
                                                setMatchesSearched(true);
                                            })
                                        }
                                    >
                                        {busy ? "Đang tìm..." : "Tìm hồ sơ cũ"}
                                    </Button>
                                </Box>

                                {matchesSearched && !matches.length && (
                                    <Typography variant="body2" color="text.secondary">
                                        Không tìm thấy hồ sơ theo số điện thoại này. Hãy bấm <strong>Tạo hồ sơ mới</strong> bên dưới.
                                    </Typography>
                                )}

                                {matches.length > 0 && (
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        label="Hồ sơ trùng khớp"
                                        value={selectedPatientId}
                                        sx={clinicFieldSx}
                                        onChange={event => setSelectedPatientId(event.target.value)}
                                    >
                                        <MenuItem value="">Chọn hồ sơ</MenuItem>
                                        {matches.map(patient => (
                                            <MenuItem key={patient.patientId} value={patient.patientId}>
                                                #{patient.patientId} · {patient.fullName} · {patient.phone}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <Button
                                        disabled={busy || !selectedPatientId}
                                        variant="contained"
                                        sx={clinicPrimaryButtonSx}
                                        onClick={() =>
                                            run(async () => {
                                                const updated = await matchAppointmentPatient(
                                                    appointment.appointmentId,
                                                    Number(selectedPatientId)
                                                );
                                                setPatientId(updated.patientProfileId);
                                            })
                                        }
                                    >
                                        Liên kết hồ sơ cũ
                                    </Button>
                                    <Button
                                        disabled={busy}
                                        variant="outlined"
                                        sx={clinicSecondaryButtonSx}
                                        onClick={() =>
                                            run(async () => {
                                                const updated = await matchAppointmentPatient(appointment.appointmentId, null);
                                                setPatientId(updated.patientProfileId);
                                            })
                                        }
                                    >
                                        Tạo hồ sơ mới
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    ) : (
                        <>
                            {/* Step 1 Done Pill */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    px: 2,
                                    py: 1.25,
                                    borderRadius: "12px",
                                    bgcolor: "#ECFDF5",
                                    borderColor: "#6EE7B7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1,
                                }}
                            >
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <CheckCircleOutlined sx={{ color: "#059669", fontSize: 19 }} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}>
                                        Bước 1 hoàn tất · Hồ sơ bệnh nhân #{patientId}
                                    </Typography>
                                </Stack>
                                {!recordsLoaded && (
                                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                        <CircularProgress size={14} />
                                        <Typography variant="caption" sx={{ color: "#065F46", fontWeight: 700 }}>
                                            Đang tải sổ khám và hóa đơn...
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>

                            {/* STEP 2: BOOK SITUATION & VERIFICATION */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    borderColor: "#0B4F8A",
                                    borderLeft: "4px solid #0B4F8A",
                                    bgcolor: "#FFFFFF",
                                }}
                            >
                                <Stack spacing={1.75}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <MenuBookOutlined sx={{ color: "#0B4F8A", fontSize: 20 }} />
                                        <FormLabel
                                            id="book-situation-label"
                                            sx={{ fontWeight: 800, fontSize: 15, color: "#0A2540 !important" }}
                                        >
                                            Bước 2/3 · Tình trạng sổ khi đến quầy
                                        </FormLabel>
                                    </Stack>

                                    <RadioGroup
                                        aria-labelledby="book-situation-label"
                                        value={bookSituation}
                                        onChange={event => {
                                            setSituation({ patientId, value: event.target.value });
                                            setBookId("");
                                            setCheckedBookKey("");
                                        }}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                            gap: 1,
                                        }}
                                    >
                                        {SITUATION_OPTIONS.map(([value, label]) => {
                                            const active = bookSituation === value;
                                            return (
                                                <Box
                                                    key={value}
                                                    sx={{
                                                        px: 1.25,
                                                        py: 0.4,
                                                        borderRadius: "10px",
                                                        border: active ? "2px solid #0B4F8A" : "1px solid #CBD5E1",
                                                        bgcolor: active ? "#E8F2FC" : "#F8FAFC",
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value={value}
                                                        sx={{ m: 0, width: "100%" }}
                                                        control={<Radio size="small" disabled={busy || !recordsLoaded} />}
                                                        label={
                                                            <Typography sx={{ fontSize: 13.5, fontWeight: active ? 800 : 600, color: "#0A2540" }}>
                                                                {label}
                                                            </Typography>
                                                        }
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </RadioGroup>

                                    {bookSituation !== "present" && (
                                        <Alert severity="warning" sx={{ borderRadius: "10px" }}>
                                            <strong>
                                                {bookSituation === "none"
                                                    ? "Bệnh nhân chưa có sổ."
                                                    : bookSituation === "lost"
                                                    ? "Bệnh nhân báo mất sổ."
                                                    : "Bệnh nhân quên mang sổ."}
                                            </strong>{" "}
                                            Thực hiện theo thứ tự: <strong>(1)</strong> Bấm <em>Yêu cầu mua / cấp lại sổ</em> bên dưới (phí sổ cấu hình:{" "}
                                            <strong>{clinic.patientBookFee.toLocaleString("vi-VN")} ₫</strong>) → <strong>(2)</strong> Hướng dẫn bệnh nhân sang{" "}
                                            <strong>Thu ngân</strong> thanh toán → <strong>(3)</strong> Nhận tín hiệu <strong>Paid</strong> để nhập số sổ mới và phát sổ.
                                        </Alert>
                                    )}

                                    {recordsLoaded && books.length === 0 && (
                                        <Typography variant="body2" color="text.secondary">
                                            Chưa có sổ khám trong hệ thống. Ghi nhận sổ giấy cũ mang theo hoặc tạo yêu cầu cấp sổ mới sau thanh toán.
                                        </Typography>
                                    )}

                                    {bookSituation === "present" && (
                                        <Stack spacing={1.5}>
                                            <TextField
                                                select
                                                size="small"
                                                fullWidth
                                                label="Sổ khám còn hiệu lực"
                                                value={selectedBook ? bookId : ""}
                                                disabled={busy || !recordsLoaded}
                                                sx={clinicFieldSx}
                                                onChange={event => {
                                                    setBookId(event.target.value);
                                                    setCheckedBookKey("");
                                                }}
                                            >
                                                <MenuItem value="">Chọn sổ đã kiểm tra</MenuItem>
                                                {books
                                                    .filter(book => book.status === "Issued")
                                                    .map(book => (
                                                        <MenuItem key={book.patientBookId} value={book.patientBookId}>
                                                            {book.bookNumber} {book.bookInvoiceId ? "· Cấp sau thanh toán" : "· Sổ cũ"}
                                                        </MenuItem>
                                                    ))}
                                            </TextField>

                                            {selectedBook && !bookPaid && (
                                                <Alert severity="warning" sx={{ borderRadius: "10px" }}>
                                                    Hóa đơn của sổ chưa được xác nhận thanh toán. Chưa thể check-in.
                                                </Alert>
                                            )}

                                            {!selectedBook && (
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: "10px",
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #DCE7F2",
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 750, color: "#0A2540" }}>
                                                        Bệnh nhân mang sổ giấy cũ chưa lưu trên hệ thống?
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#475569", display: "block", mb: 1 }}>
                                                        Nhập số sổ mang theo → tích xác nhận kiểm tra sổ ở khung bên dưới → bấm <strong>Ghi nhận sổ cũ</strong>.
                                                    </Typography>
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            label="Số sổ mang theo"
                                                            value={existingBookNumber}
                                                            disabled={busy || !recordsLoaded}
                                                            sx={clinicFieldSx}
                                                            onChange={event => {
                                                                setExistingBookNumber(event.target.value);
                                                                setCheckedBookKey("");
                                                            }}
                                                            slotProps={{ htmlInput: { maxLength: 40 } }}
                                                        />
                                                        <Button
                                                            disabled={busy || !recordsLoaded || !existingBookNumber.trim() || !presented}
                                                            variant="outlined"
                                                            sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}
                                                            onClick={() =>
                                                                run(async () => {
                                                                    const book = await registerExistingBook(
                                                                        patientId,
                                                                        existingBookNumber.trim()
                                                                    );
                                                                    await refreshBooks();
                                                                    setBookId(book.patientBookId);
                                                                    setCheckedBookKey(`${patientId}:${book.patientBookId}:${book.bookNumber}`);
                                                                    setExistingBookNumber("");
                                                                })
                                                            }
                                                        >
                                                            Ghi nhận sổ cũ
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Highlighted Mandatory Physical Verification Box */}
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: "10px",
                                                    bgcolor: presented ? "#ECFDF5" : "#FFFBEB",
                                                    border: `1.5px solid ${presented ? "#10B981" : "#F59E0B"}`,
                                                }}
                                            >
                                                <FormControlLabel
                                                    sx={{ m: 0, alignItems: "flex-start" }}
                                                    control={
                                                        <Checkbox
                                                            checked={presented}
                                                            disabled={
                                                                busy || !recordsLoaded || (!selectedBook && !existingBookNumber.trim())
                                                            }
                                                            onChange={event =>
                                                                setCheckedBookKey(event.target.checked ? currentBookKey : "")
                                                            }
                                                            sx={{ pt: 0.2 }}
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: presented ? "#065F46" : "#92400E" }}>
                                                                Đã kiểm tra sổ bệnh nhân mang theo
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 12, color: presented ? "#047857" : "#B45309" }}>
                                                                Bắt buộc đối chiếu trực tiếp sổ giấy hợp lệ để mở khóa Check-in
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            </Paper>

                            {/* BOOK REQUEST & ISSUE AFTER PAID SECTION (VI.7 & VI.10) */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    borderColor: readyInvoices.length > 0 ? "#10B981" : "#CBD8E6",
                                    borderLeft: readyInvoices.length > 0 ? "4px solid #059669" : "4px solid #64748B",
                                    bgcolor: readyInvoices.length > 0 ? "#F0FDF4" : "#F8FAFC",
                                }}
                            >
                                <Stack spacing={1.25}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 14.5, color: "#0A2540" }}>
                                            Yêu cầu mua sổ & Phát / cấp lại sổ sau thanh toán
                                        </Typography>
                                        {readyInvoices.length > 0 && (
                                            <Chip
                                                size="small"
                                                label="Đã nhận Paid từ Thu ngân"
                                                sx={{ bgcolor: "#059669", color: "#FFFFFF", fontWeight: 800 }}
                                            />
                                        )}
                                    </Stack>

                                    {readyInvoices.length > 0 && (
                                        <Alert severity="success" sx={{ borderRadius: "10px" }}>
                                            Hóa đơn {readyInvoices.map(invoice => `#${invoice.bookInvoiceId}`).join(", ")} đã thanh toán. Nhập số sổ để phát hoặc cấp lại sổ cho bệnh nhân.
                                            {books.some(book => book.status === "Issued") && " Cấp lại sẽ ngừng hiệu lực sổ cũ."}
                                        </Alert>
                                    )}

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            label="Số sổ mới"
                                            placeholder="VD: SKB-2026-001"
                                            value={newBookNumber}
                                            disabled={busy || !recordsLoaded}
                                            sx={clinicFieldSx}
                                            onChange={event => setNewBookNumber(event.target.value)}
                                            slotProps={{ htmlInput: { maxLength: 40 } }}
                                        />
                                        <Button
                                            disabled={busy || !recordsLoaded || bookSituation === "present" || hasOpenBookRequest}
                                            variant={bookSituation !== "present" && !hasOpenBookRequest ? "contained" : "outlined"}
                                            sx={
                                                bookSituation !== "present" && !hasOpenBookRequest
                                                    ? { ...clinicPrimaryButtonSx, whiteSpace: "nowrap" }
                                                    : { ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }
                                            }
                                            onClick={() =>
                                                run(async () => {
                                                    await createBookRequest(
                                                        patientId,
                                                        { none: "New", lost: "Lost", forgot: "Forgot" }[bookSituation]
                                                    );
                                                    await refreshBooks();
                                                })
                                            }
                                        >
                                            Yêu cầu mua / cấp lại sổ
                                        </Button>
                                    </Stack>

                                    {recordsLoaded &&
                                        bookRequests.map(request => (
                                            <Alert key={request.patientBookRequestId} severity="info" sx={{ borderRadius: "10px" }}>
                                                Yêu cầu #{request.patientBookRequestId} ·{" "}
                                                {request.status === "Pending"
                                                    ? "Đã ghi nhận yêu cầu mua/cấp lại sổ. Hướng dẫn bệnh nhân sang Thu ngân và theo dõi xác nhận thanh toán bên dưới"
                                                    : request.status === "Unpaid"
                                                    ? "Chờ thanh toán tại Thu ngân"
                                                    : request.status === "Issued"
                                                    ? "Đã phát sổ"
                                                    : "Đã thanh toán, có thể phát sổ"}
                                                . Hồ sơ và lịch sử khám của bệnh nhân được giữ nguyên.
                                            </Alert>
                                        ))}

                                    {invoices.map(invoice => {
                                        const isReady = readyInvoices.some(ready => ready.bookInvoiceId === invoice.bookInvoiceId);
                                        return (
                                            <Stack
                                                key={invoice.bookInvoiceId}
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1}
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: "9px",
                                                    bgcolor: "#FFFFFF",
                                                    border: "1px solid #DCE7F2",
                                                    alignItems: { sm: "center" },
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0A2540" }}>
                                                    #{invoice.bookInvoiceId} · {invoice.amount.toLocaleString("vi-VN")} ₫ · {invoice.status}
                                                </Typography>
                                                {isReady && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        sx={{ ...clinicButtonSx, minHeight: 34, px: 1.75 }}
                                                        disabled={busy || !recordsLoaded || !newBookNumber.trim()}
                                                        onClick={() =>
                                                            run(async () => {
                                                                const book = await issueBook(
                                                                    invoice.bookInvoiceId,
                                                                    newBookNumber.trim()
                                                                );
                                                                await refreshBooks();
                                                                setBookId(book.patientBookId);
                                                                setSituation({ patientId, value: "present" });
                                                                setCheckedBookKey("");
                                                                setNewBookNumber("");
                                                            })
                                                        }
                                                    >
                                                        Phát / cấp lại sổ
                                                    </Button>
                                                )}
                                            </Stack>
                                        );
                                    })}

                                    {selectedBook?.issuedByUserId && (
                                        <Typography variant="caption" sx={{ color: "#475569" }}>
                                            Người cấp: #{selectedBook.issuedByUserId} ·{" "}
                                            {new Date(selectedBook.issuedAt).toLocaleString("vi-VN", {
                                                timeZone: "Asia/Ho_Chi_Minh",
                                            })}
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>

                            {/* STEP 3: LIVE CHECK-IN READINESS CHECKLIST (VI.9) */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.75,
                                    borderRadius: "12px",
                                    bgcolor: canCheckIn ? "#ECFDF5" : "#F8FAFC",
                                    borderColor: canCheckIn ? "#10B981" : "#CBD8E6",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: canCheckIn ? "#065F46" : "#0A2540",
                                        mb: 1,
                                    }}
                                >
                                    {canCheckIn
                                        ? "✓ Bước 3/3 · Đã đủ điều kiện! Bấm Check-in để chuyển bệnh nhân sang Bác sĩ"
                                        : "Bước 3/3 · Bảng kiểm điều kiện mở khóa Check-in"}
                                </Typography>
                                <Stack spacing={0.65}>
                                    {checklistItems.map(([label, ok]) => (
                                        <Stack key={label} direction="row" spacing={0.85} sx={{ alignItems: "center" }}>
                                            {ok ? (
                                                <CheckCircleOutlined sx={{ fontSize: 16, color: "#059669", flexShrink: 0 }} />
                                            ) : (
                                                <RadioButtonUncheckedOutlined sx={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }} />
                                            )}
                                            <Typography sx={{ fontSize: 12.5, fontWeight: ok ? 700 : 500, color: ok ? "#065F46" : "#475569" }}>
                                                {label}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={clinicDialogActionsSx}>
                <Button disabled={busy} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>
                    Đóng
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AssignmentTurnedInOutlined />}
                    disabled={busy || !canCheckIn}
                    sx={clinicPrimaryButtonSx}
                    onClick={() =>
                        run(async () => {
                            await checkInAppointment(appointment.appointmentId, {
                                patientProfileId: patientId,
                                patientBookId: Number(bookId),
                                bookPresented: presented,
                            });
                            onCheckedIn();
                        })
                    }
                >
                    Check-in
                </Button>
            </DialogActions>
        </Dialog>
    );
}
