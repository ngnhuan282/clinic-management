import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Grid,
    LinearProgress,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    AddCircleOutlineOutlined,
    AssignmentTurnedInOutlined,
    CalendarMonthOutlined,
    CancelOutlined,
    CheckCircleOutlineOutlined,
    EditCalendarOutlined,
    EventAvailableOutlined,
    FactCheckOutlined,
    FilterAltOutlined,
    HighlightOffOutlined,
    HowToRegOutlined,
    PeopleAltOutlined,
    RefreshOutlined,
    RestartAltOutlined,
    SearchOutlined,
    SensorsOutlined,
} from "@mui/icons-material";
import {
    cancelAppointment,
    confirmAppointment,
    createDirectAppointment,
    getAppointments,
    rescheduleAppointment,
} from "../../api/appointmentApi";
import { findPatientMatches } from "../../api/receptionApi";
import ReceptionCheckInDialog from "../../components/internal/ReceptionCheckInDialog";
import AppointmentDialogs from "../../components/internal/appointments/AppointmentDialogs";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { formatDate } from "../../utils/formatDate";
import useNotifications from "../../hooks/useNotifications";
import {
    clinicButtonSx,
    clinicColors,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
    clinicTableSx,
} from "../../components/common/clinicUi";

const STATUS_OPTIONS = [
    { value: "Pending", label: "Chờ xác nhận" },
    { value: "Confirmed", label: "Đã xác nhận" },
    { value: "InProgress", label: "Đang khám" },
    { value: "Completed", label: "Hoàn tất" },
    { value: "Cancelled", label: "Đã hủy" },
];

const OUTLINE_ACTION_SX = {
    minHeight: 32,
    px: 1.25,
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 700,
    fontSize: 13,
    bgcolor: "#FFFFFF",
    border: "1px solid #CBD8E6",
    color: "#1E293B",
    "&:hover": {
        bgcolor: "#F1F6FB",
        borderColor: "#0B4F8A",
    },
};

function toDateInput(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

function formatTime(value) {
    if (!value) return "--:--";
    return String(value).slice(0, 5);
}

function toDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(dateText, days) {
    const [year, month, day] = dateText.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toDateValue(date);
}

function formatShortDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(date);
}

function emptyDialogForm() {
    return {
        departmentId: "",
        doctorId: "",
        appointmentDate: "",
        startTime: "",
        patientName: "",
        patientPhone: "",
        patientProfileId: "",
        birthDate: "",
        identityNumber: "",
        insuranceCode: "",
        reason: "",
    };
}

export default function AppointmentsPage() {
    const {
        revision,
        availabilityRevision,
        appointmentEvent,
        bookInvoiceEvent,
        patientBookEvent,
    } = useNotifications();
    const appointmentRequest = useRef(0);
    const summaryRequest = useRef(0);
    const initialRevisionRef = useRef(revision);
    const today = toDateValue(new Date());
    const [query, setQuery] = useState({
        pageNumber: 1,
        pageSize: 10,
        search: "",
        status: "",
        doctorId: "",
        dateFrom: today,
        dateTo: "",
    });
    const [search, setSearch] = useState("");
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [summary, setSummary] = useState({
        total: 0,
        Pending: 0,
        Confirmed: 0,
        Cancelled: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [liveBanner, setLiveBanner] = useState("");
    const [action, setAction] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState("");
    const [bulkSaving, setBulkSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filterDoctors, setFilterDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [dialogForm, setDialogForm] = useState(emptyDialogForm);
    const [toast, setToast] = useState({ open: false, status: "success", message: "" });
    const [patientMatches, setPatientMatches] = useState([]);
    const [matchingPatients, setMatchingPatients] = useState(false);
    const [checkInAppointment, setCheckInAppointment] = useState(null);

    useEffect(() => {
        if (!appointmentEvent) return;
        const timer = setTimeout(
            () =>
                setCheckInAppointment(current =>
                    current?.appointmentId === appointmentEvent.appointmentId
                        ? { ...current, ...appointmentEvent }
                        : current
                ),
            0
        );
        return () => clearTimeout(timer);
    }, [appointmentEvent]);

    useEffect(() => {
        if (revision <= initialRevisionRef.current) return;
        const timer = setTimeout(() => {
            if (bookInvoiceEvent?.status === "Paid") {
                setLiveBanner(
                    `Đồng bộ thời gian thực: Thu ngân vừa ghi nhận thanh toán hóa đơn sổ #${bookInvoiceEvent.bookInvoiceId} (Paid).`
                );
            } else if (patientBookEvent?.bookNumber) {
                setLiveBanner(
                    `Đồng bộ thời gian thực: Đã cập nhật sổ khám ${patientBookEvent.bookNumber}.`
                );
            } else if (appointmentEvent?.appointmentId) {
                setLiveBanner(
                    `Đồng bộ thời gian thực: Danh sách lịch hẹn vừa tự động cập nhật (Lịch #${appointmentEvent.appointmentId}).`
                );
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [revision, appointmentEvent, bookInvoiceEvent, patientBookEvent]);

    function changeFilter(key, value) {
        setQuery(current => ({ ...current, [key]: value, pageNumber: 1 }));
    }

    const pendingItems = items.filter(item => item.status === "Pending");
    const selectedPendingItems = items.filter(
        item => selectedIds.includes(item.appointmentId) && item.status === "Pending"
    );
    const allPendingSelected =
        pendingItems.length > 0 && pendingItems.every(item => selectedIds.includes(item.appointmentId));
    const somePendingSelected =
        pendingItems.some(item => selectedIds.includes(item.appointmentId)) && !allPendingSelected;

    function toggleSelectAllPending(checked) {
        if (checked) {
            setSelectedIds(current =>
                Array.from(new Set([...current, ...pendingItems.map(item => item.appointmentId)]))
            );
            return;
        }

        const pendingIds = new Set(pendingItems.map(item => item.appointmentId));
        setSelectedIds(current => current.filter(id => !pendingIds.has(id)));
    }

    function toggleSelectAppointment(appointmentId, checked) {
        setSelectedIds(current =>
            checked
                ? Array.from(new Set([...current, appointmentId]))
                : current.filter(id => id !== appointmentId)
        );
    }

    const loadAppointments = useCallback(
        async signal => {
            const requestId = ++appointmentRequest.current;
            setLoading(true);
            setError("");
            try {
                const data = await getAppointments(
                    {
                        pageNumber: query.pageNumber,
                        pageSize: query.pageSize,
                        search: query.search || undefined,
                        status: query.status || undefined,
                        dateFrom: query.dateFrom || undefined,
                        dateTo: query.dateTo || undefined,
                        doctorId: query.doctorId || undefined,
                    },
                    signal
                );
                if (signal?.aborted || requestId !== appointmentRequest.current) return;
                setItems(data.items || []);
                setTotalItems(data.totalItems || 0);
                setSelectedIds(current =>
                    current.filter(id => (data.items || []).some(item => item.appointmentId === id))
                );
            } catch (err) {
                if (err.name !== "CanceledError" && requestId === appointmentRequest.current) {
                    setError(getApiErrorMessage(err));
                }
            } finally {
                if (!signal?.aborted && requestId === appointmentRequest.current) setLoading(false);
            }
        },
        [query]
    );

    const loadSummary = useCallback(
        async signal => {
            const requestId = ++summaryRequest.current;
            try {
                const filters = {
                    pageNumber: 1,
                    pageSize: 1,
                    search: query.search || undefined,
                    dateFrom: query.dateFrom || undefined,
                    dateTo: query.dateTo || undefined,
                    doctorId: query.doctorId || undefined,
                };
                const [all, pending, confirmed, cancelled] = await Promise.all([
                    getAppointments(filters, signal),
                    getAppointments({ ...filters, status: "Pending" }, signal),
                    getAppointments({ ...filters, status: "Confirmed" }, signal),
                    getAppointments({ ...filters, status: "Cancelled" }, signal),
                ]);
                if (signal?.aborted || requestId !== summaryRequest.current) return;
                setSummary({
                    total: all.totalItems || 0,
                    Pending: pending.totalItems || 0,
                    Confirmed: confirmed.totalItems || 0,
                    Cancelled: cancelled.totalItems || 0,
                });
            } catch {
                setSummary(current => current);
            }
        },
        [query.search, query.dateFrom, query.dateTo, query.doctorId]
    );

    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => loadAppointments(controller.signal));
        return () => {
            controller.abort();
            appointmentRequest.current += 1;
        };
    }, [loadAppointments, revision]);

    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => loadSummary(controller.signal));
        return () => {
            controller.abort();
            summaryRequest.current += 1;
        };
    }, [loadSummary, revision]);

    useEffect(() => {
        let active = true;
        getDepartments()
            .then(async result => {
                if (!active) return;
                setDepartments(result);
                const doctorLists = await Promise.all(
                    result.map(department => getDoctorsByDepartment(department.departmentId))
                );
                if (active) {
                    setFilterDoctors(
                        doctorLists
                            .flat()
                            .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"))
                    );
                }
            })
            .catch(() => setDepartments([]));
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!dialogForm.departmentId) return;
        getDoctorsByDepartment(dialogForm.departmentId)
            .then(setDoctors)
            .catch(() => setDoctors([]));
    }, [dialogForm.departmentId]);

    useEffect(() => {
        if (!dialogForm.doctorId || !dialogForm.appointmentDate) return;
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            setSlotsLoading(true);
            return getAvailableSlots(dialogForm.doctorId, dialogForm.appointmentDate)
                .then(result => {
                    if (!active) return;
                    const available = result.filter(slot => slot.isAvailable);
                    setSlots(available);
                    setDialogForm(current =>
                        current.startTime && !available.some(slot => slot.startTime === current.startTime)
                            ? { ...current, startTime: "" }
                            : current
                    );
                })
                .catch(() => {
                    if (active) {
                        setSlots([]);
                        setDialogForm(current => ({ ...current, startTime: "" }));
                    }
                })
                .finally(() => {
                    if (active) setSlotsLoading(false);
                });
        });
        return () => {
            active = false;
        };
    }, [dialogForm.doctorId, dialogForm.appointmentDate, availabilityRevision]);

    function openConfirm(appointment) {
        setAction({ type: "confirm", appointment });
        setDialogError("");
        setNotice("");
    }

    function openCancel(appointment) {
        setAction({ type: "cancel", appointment });
        setDialogError("");
        setNotice("");
    }

    function openReschedule(appointment) {
        setAction({ type: "reschedule", appointment });
        setDialogError("");
        setNotice("");
        setDoctors([]);
        setSlots([]);
        setDialogForm({
            ...emptyDialogForm(),
            appointmentDate: toDateInput(appointment.appointmentDate),
        });
    }

    function openCreate() {
        setAction({ type: "create" });
        setDialogError("");
        setNotice("");
        setDoctors([]);
        setSlots([]);
        setPatientMatches([]);
        setDialogForm({
            ...emptyDialogForm(),
            appointmentDate: today,
        });
    }

    async function handleMatchPatients() {
        setMatchingPatients(true);
        setDialogError("");
        try {
            setPatientMatches(await findPatientMatches(dialogForm.patientPhone.trim()));
        } catch (err) {
            setDialogError(getApiErrorMessage(err));
        } finally {
            setMatchingPatients(false);
        }
    }

    async function submitAction() {
        if (saving || !action) return;
        setSaving(true);
        setDialogError("");
        try {
            if (action.type === "create") {
                setToast({
                    open: true,
                    status: "loading",
                    message: "Đang đặt lịch hẹn...",
                });
                await createDirectAppointment({
                    doctorId: Number(dialogForm.doctorId),
                    appointmentDate: dialogForm.appointmentDate,
                    startTime: dialogForm.startTime,
                    patientName: dialogForm.patientName.trim(),
                    patientPhone: dialogForm.patientPhone.trim(),
                    patientProfileId: dialogForm.patientProfileId
                        ? Number(dialogForm.patientProfileId)
                        : null,
                    birthDate: dialogForm.birthDate || null,
                    identityNumber: dialogForm.identityNumber.trim() || null,
                    insuranceCode: dialogForm.insuranceCode.trim() || null,
                    reason: dialogForm.reason.trim(),
                });
                setToast({
                    open: true,
                    status: "success",
                    message: "Đã đặt lịch thành công.",
                });
            } else if (action.type === "confirm") {
                await confirmAppointment(action.appointment.appointmentId);
                setNotice("Đã xác nhận lịch hẹn.");
            } else if (action.type === "cancel") {
                await cancelAppointment(action.appointment.appointmentId);
                setNotice("Đã hủy lịch hẹn.");
            } else {
                await rescheduleAppointment(action.appointment.appointmentId, {
                    doctorId: Number(dialogForm.doctorId),
                    appointmentDate: dialogForm.appointmentDate,
                    startTime: dialogForm.startTime,
                });
                setNotice("Đã đổi lịch và xác nhận lịch hẹn.");
            }
            setAction(null);
            setDialogForm(emptyDialogForm());
            await loadAppointments();
            await loadSummary();
        } catch (err) {
            if (action.type === "create") {
                setToast({
                    open: true,
                    status: "error",
                    message: getApiErrorMessage(err),
                });
            }
            setDialogError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function confirmSelectedAppointments() {
        if (!selectedPendingItems.length || bulkSaving) return;

        setBulkSaving(true);
        setToast({
            open: true,
            status: "loading",
            message: `Đang xác nhận ${selectedPendingItems.length} lịch hẹn...`,
        });

        try {
            await Promise.all(
                selectedPendingItems.map(appointment => confirmAppointment(appointment.appointmentId))
            );
            setSelectedIds([]);
            setToast({
                open: true,
                status: "success",
                message: `Đã xác nhận ${selectedPendingItems.length} lịch hẹn.`,
            });
            await loadAppointments();
            await loadSummary();
        } catch (err) {
            setToast({
                open: true,
                status: "error",
                message: getApiErrorMessage(err),
            });
        } finally {
            setBulkSaving(false);
        }
    }

    const dayAfterTomorrow = addDays(today, 2);
    const dayAfterName =
        new Date(dayAfterTomorrow).getDay() === 0
            ? "Chủ nhật"
            : `Thứ ${new Date(dayAfterTomorrow).getDay() + 1}`;
    const directDateOptions = [
        { label: `Hôm nay (${formatShortDate(today)})`, value: today },
        { label: `Ngày mai (${formatShortDate(addDays(today, 1))})`, value: addDays(today, 1) },
        { label: `${dayAfterName} (${formatShortDate(dayAfterTomorrow)})`, value: dayAfterTomorrow },
    ];

    const statCards = [
        {
            key: "",
            title: "Tổng lượt hẹn",
            value: summary.total,
            color: "#0B4F8A",
            soft: "#E8F2FC",
            border: "#BFDBFE",
            icon: PeopleAltOutlined,
        },
        {
            key: "Pending",
            title: "Chờ xác nhận",
            value: summary.Pending,
            color: "#D97706",
            soft: "#FFFBEB",
            border: "#FDE68A",
            icon: CalendarMonthOutlined,
        },
        {
            key: "Confirmed",
            title: "Đã xác nhận",
            value: summary.Confirmed,
            color: "#059669",
            soft: "#ECFDF5",
            border: "#A7F3D0",
            icon: EventAvailableOutlined,
        },
        {
            key: "Cancelled",
            title: "Đã hủy",
            value: summary.Cancelled,
            color: "#DC2626",
            soft: "#FEF2F2",
            border: "#FECACA",
            icon: HighlightOffOutlined,
        },
    ];

    const isTodayFilter = query.dateFrom === today && !query.dateTo;
    const isTomorrowFilter = query.dateFrom === addDays(today, 1) && query.dateTo === addDays(today, 1);
    const isAllDatesFilter = !query.dateFrom && !query.dateTo;

    return (
        <Stack spacing={2.5} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                eyebrow="Quầy tiếp nhận lễ tân"
                badge={
                    <Chip
                        size="small"
                        icon={<SensorsOutlined sx={{ fontSize: "15px !important", color: "#059669 !important" }} />}
                        label="Đồng bộ thời gian thực"
                        sx={{
                            bgcolor: "#ECFDF5",
                            color: "#065F46",
                            border: "1px solid #6EE7B7",
                            fontWeight: 750,
                            fontSize: 12,
                        }}
                    />
                }
                title="Điều phối & Xác nhận lịch hẹn"
                icon={FactCheckOutlined}
                description="Tra cứu, xác nhận lịch đặt trước, đặt lịch trực tiếp tại quầy và thực hiện Check-in bệnh nhân."
                actions={
                    <>
                        <Button
                            variant="contained"
                            startIcon={<AddCircleOutlineOutlined />}
                            onClick={openCreate}
                            sx={clinicPrimaryButtonSx}
                        >
                            Đặt lịch trực tiếp
                        </Button>
                        <Button
                            aria-label="Tải lại lịch hẹn"
                            variant="outlined"
                            startIcon={<RefreshOutlined />}
                            onClick={() => {
                                void loadAppointments();
                                void loadSummary();
                            }}
                            disabled={loading}
                            sx={clinicSecondaryButtonSx}
                        >
                            Tải lại
                        </Button>
                    </>
                }
            />

            {/* Clickable Quick-Triage Stat Cards */}
            <Grid container spacing={1.75}>
                {statCards.map(card => {
                    const Icon = card.icon;
                    const active = query.status === card.key;
                    return (
                        <Grid key={card.title} size={{ xs: 6, lg: 3 }} sx={{ minWidth: 0 }}>
                            <Paper
                                variant="outlined"
                                onClick={() => changeFilter("status", active && card.key ? "" : card.key)}
                                sx={{
                                    p: { xs: 1.75, sm: 2.25 },
                                    height: "100%",
                                    cursor: "pointer",
                                    borderRadius: "14px",
                                    borderColor: active ? card.color : "#D8E4F0",
                                    borderTop: `4px solid ${card.color}`,
                                    bgcolor: active ? card.soft : "#FFFFFF",
                                    boxShadow: active ? `0 0 0 2px ${card.border}` : "0 2px 10px rgba(10, 37, 64, 0.035)",
                                    transition: "all 0.15s ease",
                                    "&:hover": {
                                        borderColor: card.color,
                                        bgcolor: card.soft,
                                    },
                                }}
                            >
                                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "#475569" }}>
                                            {card.title}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                fontSize: { xs: 22, sm: 26 },
                                                fontWeight: 800,
                                                color: card.color,
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {card.value}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "10px",
                                            bgcolor: card.soft,
                                            color: card.color,
                                            border: `1px solid ${card.border}`,
                                            display: "grid",
                                            placeItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {liveBanner && (
                <Alert
                    severity="info"
                    icon={<SensorsOutlined />}
                    onClose={() => setLiveBanner("")}
                    sx={{ borderRadius: "12px", bgcolor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7" }}
                >
                    {liveBanner}
                </Alert>
            )}
            {notice && (
                <Alert severity="success" onClose={() => setNotice("")} sx={{ borderRadius: "12px" }}>
                    {notice}
                </Alert>
            )}
            {error && (
                <Alert
                    severity="error"
                    sx={{ borderRadius: "12px" }}
                    action={
                        <Button color="inherit" onClick={() => loadAppointments()}>
                            Thử lại
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Filter & Triage Table */}
            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden", minWidth: 0 }}>
                <Box
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        bgcolor: "#F8FBFF",
                        borderBottom: `1px solid ${clinicColors.border}`,
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                <FilterAltOutlined sx={{ fontSize: 19, color: clinicColors.primary }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, color: clinicColors.heading }}>
                                    Danh sách lịch hẹn
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: clinicColors.muted, mt: 0.25 }}>
                                Hiển thị <strong>{items.length}</strong> / <strong>{totalItems}</strong> lịch hẹn
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleOutlineOutlined />}
                                disabled={!selectedPendingItems.length || bulkSaving}
                                onClick={confirmSelectedAppointments}
                                sx={clinicButtonSx}
                            >
                                {bulkSaving
                                    ? "Đang xác nhận..."
                                    : `Xác nhận hàng loạt${selectedPendingItems.length ? ` (${selectedPendingItems.length})` : ""}`}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Quick Date Filter Chips */}
                    <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#475569", mr: 0.5 }}>
                            Xem nhanh theo ngày:
                        </Typography>
                        <Chip
                            size="small"
                            clickable
                            label={`Từ hôm nay (${formatShortDate(today)})`}
                            onClick={() =>
                                setQuery(current => ({ ...current, dateFrom: today, dateTo: "", pageNumber: 1 }))
                            }
                            sx={{
                                fontWeight: 700,
                                bgcolor: isTodayFilter ? "#0B4F8A" : "#FFFFFF",
                                color: isTodayFilter ? "#FFFFFF" : "#0B4F8A",
                                border: "1px solid #90BCE6",
                            }}
                        />
                        <Chip
                            size="small"
                            clickable
                            label={`Chỉ hôm nay (${formatShortDate(today)})`}
                            onClick={() =>
                                setQuery(current => ({ ...current, dateFrom: today, dateTo: today, pageNumber: 1 }))
                            }
                            sx={{
                                fontWeight: 700,
                                bgcolor: query.dateFrom === today && query.dateTo === today ? "#0B4F8A" : "#FFFFFF",
                                color: query.dateFrom === today && query.dateTo === today ? "#FFFFFF" : "#0B4F8A",
                                border: "1px solid #90BCE6",
                            }}
                        />
                        <Chip
                            size="small"
                            clickable
                            label={`Ngày mai (${formatShortDate(addDays(today, 1))})`}
                            onClick={() =>
                                setQuery(current => ({
                                    ...current,
                                    dateFrom: addDays(today, 1),
                                    dateTo: addDays(today, 1),
                                    pageNumber: 1,
                                }))
                            }
                            sx={{
                                fontWeight: 700,
                                bgcolor: isTomorrowFilter ? "#0B4F8A" : "#FFFFFF",
                                color: isTomorrowFilter ? "#FFFFFF" : "#0B4F8A",
                                border: "1px solid #90BCE6",
                            }}
                        />
                        <Chip
                            size="small"
                            clickable
                            label="Mọi ngày"
                            onClick={() =>
                                setQuery(current => ({ ...current, dateFrom: "", dateTo: "", pageNumber: 1 }))
                            }
                            sx={{
                                fontWeight: 700,
                                bgcolor: isAllDatesFilter ? "#0B4F8A" : "#FFFFFF",
                                color: isAllDatesFilter ? "#FFFFFF" : "#0B4F8A",
                                border: "1px solid #90BCE6",
                            }}
                        />
                    </Stack>
                </Box>

                {/* Filter Form */}
                <Stack
                    component="form"
                    onSubmit={event => {
                        event.preventDefault();
                        changeFilter("search", search.trim());
                    }}
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    useFlexGap
                    sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: "#F3F7FB", flexWrap: "wrap", minWidth: 0 }}
                >
                    <TextField
                        label="Tìm lịch hẹn"
                        placeholder="Tên, SĐT, bác sĩ hoặc lý do"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        size="small"
                        sx={{ flex: 1, minWidth: { xs: 0, sm: 220 }, ...clinicFieldSx }}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                    />
                    <Button type="submit" variant="contained" startIcon={<SearchOutlined />} sx={clinicPrimaryButtonSx}>
                        Tìm kiếm
                    </Button>
                    <TextField
                        select
                        label="Trạng thái"
                        value={query.status}
                        onChange={event => changeFilter("status", event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: 0, sm: 175 }, ...clinicFieldSx }}
                    >
                        <MenuItem value="">Tất cả trạng thái</MenuItem>
                        {STATUS_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Bác sĩ"
                        value={query.doctorId}
                        onChange={event => changeFilter("doctorId", event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: 0, sm: 185 }, ...clinicFieldSx }}
                    >
                        <MenuItem value="">Tất cả bác sĩ</MenuItem>
                        {filterDoctors.map(doctor => (
                            <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
                                {doctor.fullName}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Từ ngày"
                        type="date"
                        value={query.dateFrom}
                        onChange={event => changeFilter("dateFrom", event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: 0, sm: 160 }, ...clinicFieldSx }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        label="Đến ngày"
                        type="date"
                        value={query.dateTo}
                        onChange={event => changeFilter("dateTo", event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: 0, sm: 160 }, ...clinicFieldSx }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Button
                        startIcon={<RestartAltOutlined />}
                        sx={clinicResetButtonSx}
                        onClick={() => {
                            setSearch("");
                            setQuery(current => ({
                                ...current,
                                search: "",
                                status: "",
                                doctorId: "",
                                dateFrom: "",
                                dateTo: "",
                                pageNumber: 1,
                            }));
                        }}
                    >
                        Xóa bộ lọc
                    </Button>
                </Stack>

                {loading && <LinearProgress aria-label="Đang tải lịch hẹn" />}

                <Typography
                    sx={{
                        px: 2,
                        py: 1,
                        display: { xs: "block", md: "none" },
                        fontSize: 12,
                        color: clinicColors.muted,
                        bgcolor: "#FFFFFF",
                    }}
                >
                    Vuốt ngang bảng để xem đầy đủ cột trạng thái và nút thao tác.
                </Typography>

                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table aria-label="Danh sách lịch hẹn" sx={{ minWidth: 980, ...clinicTableSx }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        aria-label="Chọn tất cả lịch chờ xác nhận"
                                        checked={allPendingSelected}
                                        indeterminate={somePendingSelected}
                                        disabled={!pendingItems.length || loading}
                                        onChange={event => toggleSelectAllPending(event.target.checked)}
                                    />
                                </TableCell>
                                {["Bệnh nhân", "Lịch khám", "Bác sĩ & Khoa", "Lý do khám", "Trạng thái", "Thao tác"].map(
                                    label => (
                                        <TableCell key={label}>{label}</TableCell>
                                    )
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map(appointment => {
                                const apptDate = toDateInput(appointment.appointmentDate);
                                const isPending = appointment.status === "Pending";
                                const isReadyCheckIn =
                                    appointment.status === "Confirmed" &&
                                    !appointment.checkedInAt &&
                                    apptDate === today;

                                return (
                                    <TableRow
                                        key={appointment.appointmentId}
                                        hover
                                        sx={{
                                            bgcolor: isPending
                                                ? "rgba(255, 251, 235, 0.45)"
                                                : isReadyCheckIn
                                                ? "rgba(232, 242, 252, 0.35)"
                                                : "#FFFFFF",
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                aria-label={`Chọn lịch hẹn của ${appointment.patientName}`}
                                                checked={selectedIds.includes(appointment.appointmentId)}
                                                disabled={!isPending || loading || bulkSaving}
                                                onChange={event =>
                                                    toggleSelectAppointment(
                                                        appointment.appointmentId,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 800, color: "#0A2540" }}>
                                                {appointment.patientName}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#475569", fontVariantNumeric: "tabular-nums" }}
                                            >
                                                {appointment.patientPhone} · #{appointment.appointmentId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                <CalendarMonthOutlined fontSize="small" color="primary" />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
                                                        {formatDate(appointment.appointmentDate)}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: "#0B4F8A", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                                                    >
                                                        {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700, color: "#0A2540" }}>
                                                {appointment.doctorName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.departmentName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 250 }}>
                                            <Typography variant="body2" sx={{ whiteSpace: "normal", lineHeight: 1.5 }}>
                                                {appointment.reason}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.6} sx={{ alignItems: "flex-start" }}>
                                                <StatusBadge status={appointment.status} />
                                                {appointment.checkedInAt && (
                                                    <Chip
                                                        size="small"
                                                        icon={<HowToRegOutlined sx={{ fontSize: "14px !important" }} />}
                                                        color="success"
                                                        label="Đã check-in"
                                                        sx={{ height: 22, fontSize: 11.5, fontWeight: 750 }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                                                <Button
                                                    size="small"
                                                    variant={isPending ? "contained" : "outlined"}
                                                    color={isPending ? "success" : "inherit"}
                                                    sx={
                                                        isPending
                                                            ? {
                                                                  minHeight: 32,
                                                                  px: 1.4,
                                                                  borderRadius: "8px",
                                                                  textTransform: "none",
                                                                  fontWeight: 800,
                                                                  fontSize: 13,
                                                                  boxShadow: "none",
                                                              }
                                                            : OUTLINE_ACTION_SX
                                                    }
                                                    startIcon={<CheckCircleOutlineOutlined />}
                                                    disabled={!isPending || loading}
                                                    onClick={() => openConfirm(appointment)}
                                                >
                                                    Xác nhận
                                                </Button>

                                                <Button
                                                    size="small"
                                                    variant={isReadyCheckIn ? "contained" : "outlined"}
                                                    sx={
                                                        isReadyCheckIn
                                                            ? {
                                                                  minHeight: 32,
                                                                  px: 1.4,
                                                                  borderRadius: "8px",
                                                                  textTransform: "none",
                                                                  fontWeight: 800,
                                                                  fontSize: 13,
                                                                  bgcolor: "#0B4F8A",
                                                                  color: "#FFFFFF",
                                                                  boxShadow: "none",
                                                                  "&:hover": { bgcolor: "#083A66", boxShadow: "none" },
                                                              }
                                                            : OUTLINE_ACTION_SX
                                                    }
                                                    startIcon={<AssignmentTurnedInOutlined />}
                                                    disabled={!isReadyCheckIn || loading}
                                                    onClick={() => setCheckInAppointment(appointment)}
                                                >
                                                    Check-in
                                                </Button>

                                                <Button
                                                    size="small"
                                                    sx={OUTLINE_ACTION_SX}
                                                    startIcon={<EditCalendarOutlined />}
                                                    disabled={
                                                        ["Cancelled", "Completed", "InProgress"].includes(
                                                            appointment.status
                                                        ) ||
                                                        Boolean(appointment.checkedInAt) ||
                                                        loading
                                                    }
                                                    onClick={() => openReschedule(appointment)}
                                                >
                                                    Đổi lịch
                                                </Button>

                                                <Button
                                                    size="small"
                                                    color="error"
                                                    sx={{
                                                        ...OUTLINE_ACTION_SX,
                                                        color: "#DC2626",
                                                        borderColor: "#FECACA",
                                                        bgcolor: "#FEF2F2",
                                                        "&:hover": { bgcolor: "#FEE2E2", borderColor: "#DC2626" },
                                                    }}
                                                    startIcon={<CancelOutlined />}
                                                    disabled={
                                                        ["Cancelled", "Completed", "InProgress"].includes(
                                                            appointment.status
                                                        ) ||
                                                        Boolean(appointment.checkedInAt) ||
                                                        loading
                                                    }
                                                    onClick={() => openCancel(appointment)}
                                                >
                                                    Hủy
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && !items.length && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography sx={{ fontWeight: 700, color: "#0A2540", mb: 0.5 }}>
                                            Không tìm thấy lịch hẹn phù hợp
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Hãy thử chọn “Mọi ngày”, xóa bộ lọc tìm kiếm hoặc bấm “Đặt lịch trực tiếp” để tiếp nhận khách mới.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalItems}
                    page={query.pageNumber - 1}
                    rowsPerPage={query.pageSize}
                    rowsPerPageOptions={[10, 20, 50]}
                    labelRowsPerPage="Số dòng"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                    onPageChange={(_, page) => setQuery(current => ({ ...current, pageNumber: page + 1 }))}
                    onRowsPerPageChange={event =>
                        setQuery(current => ({
                            ...current,
                            pageNumber: 1,
                            pageSize: Number(event.target.value),
                        }))
                    }
                />
            </Paper>

            <AppointmentDialogs
                action={action}
                saving={saving}
                dialogError={dialogError}
                dialogForm={dialogForm}
                setDialogForm={setDialogForm}
                departments={departments}
                doctors={doctors}
                setDoctors={setDoctors}
                slots={slots}
                setSlots={setSlots}
                slotsLoading={slotsLoading}
                patientMatches={patientMatches}
                setPatientMatches={setPatientMatches}
                matchingPatients={matchingPatients}
                onMatchPatients={handleMatchPatients}
                today={today}
                directDateOptions={directDateOptions}
                onClose={() => setAction(null)}
                onSubmit={submitAction}
            />

            {checkInAppointment && (
                <ReceptionCheckInDialog
                    appointment={
                        items.find(item => item.appointmentId === checkInAppointment.appointmentId) ||
                        checkInAppointment
                    }
                    onClose={() => setCheckInAppointment(null)}
                    onCheckedIn={async () => {
                        setCheckInAppointment(null);
                        setNotice("Đã check-in sau khi kiểm tra sổ khám.");
                        await loadAppointments();
                        await loadSummary();
                    }}
                />
            )}

            <Snackbar
                open={toast.open}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                autoHideDuration={toast.status === "loading" ? null : 3000}
                onClose={() => {
                    if (toast.status !== "loading") setToast(current => ({ ...current, open: false }));
                }}
            >
                <Alert
                    severity={toast.status === "error" ? "error" : "success"}
                    variant="filled"
                    icon={toast.status === "loading" ? <CircularProgress size={18} color="inherit" /> : undefined}
                    sx={{ alignItems: "center", minWidth: 280, boxShadow: "0 14px 34px rgba(22, 45, 74, 0.24)" }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Stack>
    );
}
