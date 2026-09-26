import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { AccessTimeOutlined, AddCircleOutlineOutlined, AssignmentTurnedInOutlined, CalendarMonthOutlined, CancelOutlined, CheckCircleOutlineOutlined, CloseOutlined, EditCalendarOutlined, EventAvailableOutlined, HighlightOffOutlined, PeopleAltOutlined, RefreshOutlined, SearchOutlined } from "@mui/icons-material";
import { cancelAppointment, confirmAppointment, createDirectAppointment, getAppointments, rescheduleAppointment } from "../../api/appointmentApi";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import StatusBadge from "../../components/common/StatusBadge";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { formatDate } from "../../utils/formatDate";

const STATUS_OPTIONS = [
    { value: "Pending", label: "Chờ xác nhận" },
    { value: "Confirmed", label: "Đã xác nhận" },
    { value: "InProgress", label: "Đang khám" },
    { value: "Completed", label: "Hoàn tất" },
    { value: "Cancelled", label: "Đã hủy" },
];

const ACTION_BUTTON_SX = {
    minWidth: 94,
    justifyContent: "flex-start",
    px: 1,
    borderRadius: 999,
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    "& .MuiButton-startIcon": {
        ml: 0,
        mr: 0.75,
    },
    "&:hover": {
        bgcolor: "#f3f8ff",
    },
};

const DIRECT_FORM_CARD_SX = {
    p: 2,
    border: "1px solid",
    borderColor: "#dbe7f3",
    bgcolor: "#f4f8fc",
    borderRadius: 2,
    boxShadow: "0 10px 22px rgba(31, 64, 104, 0.06)",
};

const FILTER_FIELD_SX = {
    "& .MuiOutlinedInput-root": {
        bgcolor: "background.paper",
        borderRadius: 1.5,
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
        birthDate: "",
        gender: "",
        identityNumber: "",
        insuranceCode: "",
        reason: "",
    };
}

export default function AppointmentsPage() {
    const today = toDateValue(new Date());
    const [query, setQuery] = useState({ pageNumber: 1, pageSize: 10, search: "", status: "", dateFrom: today, dateTo: "" });
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
    const [action, setAction] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState("");
    const [bulkSaving, setBulkSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [dialogForm, setDialogForm] = useState(emptyDialogForm);
    const [toast, setToast] = useState({ open: false, status: "success", message: "" });

    function changeFilter(key, value) {
        setQuery(current => ({ ...current, [key]: value, pageNumber: 1 }));
    }

    const pendingItems = items.filter(item => item.status === "Pending");
    const selectedPendingItems = items.filter(item =>
        selectedIds.includes(item.appointmentId)
        && item.status === "Pending"
    );
    const allPendingSelected = pendingItems.length > 0
        && pendingItems.every(item => selectedIds.includes(item.appointmentId));
    const somePendingSelected = pendingItems.some(item => selectedIds.includes(item.appointmentId))
        && !allPendingSelected;

    function toggleSelectAllPending(checked) {
        if (checked) {
            setSelectedIds(current => Array.from(new Set([
                ...current,
                ...pendingItems.map(item => item.appointmentId),
            ])));
            return;
        }

        const pendingIds = new Set(pendingItems.map(item => item.appointmentId));
        setSelectedIds(current => current.filter(id => !pendingIds.has(id)));
    }

    function toggleSelectAppointment(appointmentId, checked) {
        setSelectedIds(current => checked
            ? Array.from(new Set([...current, appointmentId]))
            : current.filter(id => id !== appointmentId));
    }

    const loadAppointments = useCallback(async (signal) => {
        setLoading(true);
        setError("");
        try {
            const data = await getAppointments({
                pageNumber: query.pageNumber,
                pageSize: query.pageSize,
                search: query.search || undefined,
                status: query.status || undefined,
                dateFrom: query.dateFrom || undefined,
                dateTo: query.dateTo || undefined,
            }, signal);
            setItems(data.items || []);
            setTotalItems(data.totalItems || 0);
            setSelectedIds(current => current.filter(id =>
                (data.items || []).some(item => item.appointmentId === id)
            ));
        } catch (err) {
            if (err.name !== "CanceledError") setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [query]);

    const loadSummary = useCallback(async () => {
        try {
            const [all, confirmed, cancelled, inProgress, completed] = await Promise.all([
                getAppointments({ pageNumber: 1, pageSize: 1 }),
                getAppointments({ pageNumber: 1, pageSize: 1, status: "Confirmed" }),
                getAppointments({ pageNumber: 1, pageSize: 1, status: "Cancelled" }),
                getAppointments({ pageNumber: 1, pageSize: 1, status: "InProgress" }),
                getAppointments({ pageNumber: 1, pageSize: 1, status: "Completed" }),
            ]);

            const total = all.totalItems || 0;
            const confirmedCount = confirmed.totalItems || 0;
            const cancelledCount = cancelled.totalItems || 0;
            const inProgressCount = inProgress.totalItems || 0;
            const completedCount = completed.totalItems || 0;

            setSummary({
                total,
                Pending: Math.max(
                    total
                    - confirmedCount
                    - cancelledCount
                    - inProgressCount
                    - completedCount,
                    0
                ),
                Confirmed: confirmedCount,
                Cancelled: cancelledCount,
            });
        } catch {
            setSummary(current => current);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => loadAppointments(controller.signal));
        return () => controller.abort();
    }, [loadAppointments]);

    useEffect(() => {
        Promise.resolve().then(loadSummary);
    }, [loadSummary]);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        if (!dialogForm.departmentId) {
            return;
        }

        getDoctorsByDepartment(dialogForm.departmentId)
            .then(setDoctors)
            .catch(() => setDoctors([]));
    }, [dialogForm.departmentId]);

    useEffect(() => {
        if (!dialogForm.doctorId || !dialogForm.appointmentDate) {
            return;
        }

        getAvailableSlots(dialogForm.doctorId, dialogForm.appointmentDate)
            .then(result => setSlots(result.filter(slot => slot.isAvailable)))
            .catch(() => setSlots([]));
    }, [dialogForm.doctorId, dialogForm.appointmentDate]);

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
        setDialogForm({
            ...emptyDialogForm(),
            appointmentDate: today,
        });
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
            message: `Đang duyệt ${selectedPendingItems.length} lịch hẹn...`,
        });

        try {
            await Promise.all(
                selectedPendingItems.map(appointment =>
                    confirmAppointment(appointment.appointmentId)
                )
            );
            setSelectedIds([]);
            setToast({
                open: true,
                status: "success",
                message: `Đã duyệt ${selectedPendingItems.length} lịch hẹn.`,
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

    const actionTitle = action?.type === "confirm"
        ? "Xác nhận lịch hẹn"
        : action?.type === "cancel"
            ? "Hủy lịch hẹn"
            : action?.type === "create"
                ? "Đặt lịch trực tiếp"
                : "Đổi lịch hẹn";

    const isScheduleDialog = action?.type === "reschedule" || action?.type === "create";
    const scheduleDisabled = !dialogForm.doctorId || !dialogForm.appointmentDate || !dialogForm.startTime;
    const createDisabled = scheduleDisabled
        || !dialogForm.patientName.trim()
        || !dialogForm.patientPhone.trim()
        || !dialogForm.reason.trim();
    const selectedDepartment = departments.find(department => String(department.departmentId) === String(dialogForm.departmentId));
    const selectedDoctor = doctors.find(doctor => String(doctor.doctorId) === String(dialogForm.doctorId));
    const selectedSlot = slots.find(slot => slot.startTime === dialogForm.startTime);
    const directDateOptions = [
        { label: `Hôm nay (${formatShortDate(today)})`, value: today },
        { label: `Ngày mai (${formatShortDate(addDays(today, 1))})`, value: addDays(today, 1) },
        { label: `Thứ ${new Date(addDays(today, 2)).getDay() + 1} (${formatShortDate(addDays(today, 2))})`, value: addDays(today, 2) },
    ];
    const directSteps = [
        { label: "Chuyên khoa", complete: Boolean(dialogForm.departmentId) },
        { label: "Bác sĩ", complete: Boolean(dialogForm.doctorId) },
        { label: "Ngày khám", complete: Boolean(dialogForm.appointmentDate) },
        { label: "Khung giờ", complete: Boolean(dialogForm.startTime) },
        {
            label: "Thông tin bệnh nhân",
            complete: Boolean(dialogForm.patientName.trim() && dialogForm.patientPhone.trim() && dialogForm.reason.trim()),
        },
        { label: "Xác nhận & Cấp số", complete: !createDisabled },
    ];
    const activeDirectStep = Math.max(
        directSteps.findIndex(step => !step.complete),
        0
    );
    const dialogMaxWidth = action?.type === "create"
        ? "md"
        : isScheduleDialog
            ? "sm"
            : "xs";

    return <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: "#f6fbff", borderColor: "#d8e7f6", boxShadow: "0 18px 40px rgba(30, 74, 120, 0.08)" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
                <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                        <Chip size="small" color="primary" label="Lễ tân" />
                        <Chip size="small" icon={<AccessTimeOutlined />} variant="outlined" label="Ca sáng 07:30 - 12:00" />
                    </Stack>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>Điều phối & Duyệt lịch hẹn</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>Xác nhận lịch online, đổi/hủy khi cần và tiếp nhận bệnh nhân vãng lai tại quầy.</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlined />} onClick={openCreate} sx={{ borderRadius: 1.5, boxShadow: "0 10px 22px rgba(25, 118, 210, 0.22)" }}>Đặt lịch trực tiếp</Button>
                    <Button aria-label="Tải lại lịch hẹn" size="large" variant="outlined" startIcon={<RefreshOutlined />} onClick={() => loadAppointments()} disabled={loading} sx={{ borderRadius: 1.5, bgcolor: "background.paper" }}>Tải lại</Button>
                </Stack>
            </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: "#f2d48b", bgcolor: "#fffaf0", position: "relative", overflow: "hidden" }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Chờ xác nhận</Typography>
                        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, color: "#9a6400" }}>{summary.Pending}</Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#ffe8ad", color: "#9a6400", display: "grid", placeItems: "center" }}><CalendarMonthOutlined /></Box>
                </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: "#b9ddc8", bgcolor: "#f1fbf5", position: "relative", overflow: "hidden" }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Đã xác nhận</Typography>
                        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, color: "#1b7f45" }}>{summary.Confirmed}</Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#c9f1d7", color: "#1b7f45", display: "grid", placeItems: "center" }}><EventAvailableOutlined /></Box>
                </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: "#f0c2bf", bgcolor: "#fff5f4", position: "relative", overflow: "hidden" }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Đã hủy</Typography>
                        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, color: "#b9473e" }}>{summary.Cancelled}</Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#ffd8d4", color: "#b9473e", display: "grid", placeItems: "center" }}><HighlightOffOutlined /></Box>
                </Stack>
            </Paper>
        </Box>

        {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
        {error && <Alert severity="error" action={<Button onClick={() => loadAppointments()}>Thử lại</Button>}>{error}</Alert>}

        <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2, borderColor: "#dce7f2", boxShadow: "0 16px 36px rgba(40, 65, 95, 0.06)" }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: "#fbfdff", borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Danh sách lịch hẹn</Typography>
                        <Typography variant="body2" color="text.secondary">Hiển thị {items.length} / {totalItems} lịch theo bộ lọc hiện tại</Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                        <Chip icon={<PeopleAltOutlined />} label={`${summary.total} lượt hẹn`} color="primary" variant="outlined" />
                        <Button variant="contained" color="success" startIcon={<CheckCircleOutlineOutlined />} disabled={!selectedPendingItems.length || bulkSaving} onClick={confirmSelectedAppointments}>
                            {bulkSaving ? "Đang duyệt..." : `Duyệt hàng loạt${selectedPendingItems.length ? ` (${selectedPendingItems.length})` : ""}`}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
            <Stack component="form" onSubmit={event => { event.preventDefault(); changeFilter("search", search.trim()); }} direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ p: 3, bgcolor: "#f6f9fc" }}>
                <TextField label="Tìm lịch hẹn" placeholder="Tên, SĐT, bác sĩ hoặc lý do" value={search} onChange={event => setSearch(event.target.value)} size="small" sx={{ flex: 1, ...FILTER_FIELD_SX }} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <Button type="submit" variant="contained" startIcon={<SearchOutlined />} sx={{ borderRadius: 1.5 }}>Tìm kiếm</Button>
                <TextField select label="Trạng thái" value={query.status} onChange={event => changeFilter("status", event.target.value)} size="small" sx={{ minWidth: 180, ...FILTER_FIELD_SX }}>
                    <MenuItem value="">Tất cả trạng thái</MenuItem>
                    {STATUS_OPTIONS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField label="Từ ngày" type="date" value={query.dateFrom} onChange={event => changeFilter("dateFrom", event.target.value)} size="small" sx={{ minWidth: 165, ...FILTER_FIELD_SX }} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Đến ngày" type="date" value={query.dateTo} onChange={event => changeFilter("dateTo", event.target.value)} size="small" sx={{ minWidth: 165, ...FILTER_FIELD_SX }} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>

            {loading && <LinearProgress aria-label="Đang tải lịch hẹn" />}

            <TableContainer>
                <Table aria-label="Danh sách lịch hẹn" sx={{ minWidth: 980 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#edf4fb" }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    aria-label="Chọn tất cả lịch chờ xác nhận"
                                    checked={allPendingSelected}
                                    indeterminate={somePendingSelected}
                                    disabled={!pendingItems.length || loading}
                                    onChange={event => toggleSelectAllPending(event.target.checked)}
                                />
                            </TableCell>
                            {["Bệnh nhân", "Lịch khám", "Bác sĩ", "Lý do", "Trạng thái", "Thao tác"].map(label => <TableCell key={label} sx={{ fontWeight: 800, color: "#23435f" }}>{label}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((appointment, index) => <TableRow key={appointment.appointmentId} hover sx={{ bgcolor: index % 2 === 0 ? "background.paper" : "#fbfdff", "&:hover": { bgcolor: "#f2f8ff" } }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    aria-label={`Chọn lịch hẹn của ${appointment.patientName}`}
                                    checked={selectedIds.includes(appointment.appointmentId)}
                                    disabled={appointment.status !== "Pending" || loading || bulkSaving}
                                    onChange={event => toggleSelectAppointment(appointment.appointmentId, event.target.checked)}
                                />
                            </TableCell>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700 }}>{appointment.patientName}</Typography>
                                <Typography variant="body2" color="text.secondary">{appointment.patientPhone}</Typography>
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <CalendarMonthOutlined fontSize="small" color="primary" />
                                    <Box>
                                        <Typography>{formatDate(appointment.appointmentDate)}</Typography>
                                        <Typography variant="body2" color="text.secondary">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</Typography>
                                    </Box>
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Typography>{appointment.doctorName}</Typography>
                                <Typography variant="body2" color="text.secondary">{appointment.departmentName}</Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                                <Typography variant="body2" sx={{ whiteSpace: "normal" }}>{appointment.reason}</Typography>
                            </TableCell>
                            <TableCell><StatusBadge status={appointment.status} /></TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                                    <Button size="small" sx={ACTION_BUTTON_SX} startIcon={<CheckCircleOutlineOutlined />} disabled={appointment.status !== "Pending" || loading} onClick={() => openConfirm(appointment)}>Duyệt</Button>
                                    <Button size="small" sx={ACTION_BUTTON_SX} startIcon={<EditCalendarOutlined />} disabled={["Cancelled", "Completed", "InProgress"].includes(appointment.status) || loading} onClick={() => openReschedule(appointment)}>Đổi lịch</Button>
                                    <Button size="small" sx={ACTION_BUTTON_SX} color="error" startIcon={<CancelOutlined />} disabled={["Cancelled", "Completed"].includes(appointment.status) || loading} onClick={() => openCancel(appointment)}>Hủy</Button>
                                </Stack>
                            </TableCell>
                        </TableRow>)}
                        {!loading && !items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>Không tìm thấy lịch hẹn phù hợp.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination component="div" count={totalItems} page={query.pageNumber - 1} rowsPerPage={query.pageSize} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Số dòng" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`} onPageChange={(_, page) => setQuery(current => ({ ...current, pageNumber: page + 1 }))} onRowsPerPageChange={event => setQuery(current => ({ ...current, pageNumber: 1, pageSize: Number(event.target.value) }))} />
        </Paper>

        <Dialog open={Boolean(action)} onClose={saving ? undefined : () => setAction(null)} fullWidth maxWidth={dialogMaxWidth}
            slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: "hidden", boxShadow: "0 28px 80px rgba(22, 45, 74, 0.26)" } } }}>
            {action?.type === "create" ? <>
                <DialogTitle sx={{ p: 0 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 2, pb: 1.5, bgcolor: "#fbfdff" }}>
                        <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 10px 20px rgba(25, 118, 210, 0.24)" }}>
                            <AssignmentTurnedInOutlined />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>Đặt Lịch Khám Trực Tiếp Tại Quầy</Typography>
                                <Chip size="small" color="primary" variant="outlined" label="Walk-in Stepper 6 Bước" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Tiếp đón bệnh nhân vãng lai & Điều phối buồng khám theo quy trình chuẩn</Typography>
                        </Box>
                        <IconButton aria-label="Đóng form đặt lịch" disabled={saving} onClick={() => setAction(null)}><CloseOutlined /></IconButton>
                    </Stack>
                    <Divider />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6, 1fr)" }, gap: 1, px: 2, py: 1.25, bgcolor: "#eef5fb" }}>
                        {directSteps.map((step, index) => {
                            const highlighted = step.complete || index === activeDirectStep;
                            return <Stack key={step.label} direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0, opacity: highlighted ? 1 : 0.52, bgcolor: highlighted ? "background.paper" : "transparent", borderRadius: 999, px: 0.75, py: 0.5, boxShadow: highlighted ? "0 4px 12px rgba(25, 118, 210, 0.10)" : "none" }}>
                                <Box sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    bgcolor: highlighted ? "primary.main" : "#d8e2ee",
                                    color: highlighted ? "primary.contrastText" : "text.secondary",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}>{index + 1}</Box>
                                <Typography variant="caption" color={highlighted ? "primary" : "text.secondary"} sx={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.label}</Typography>
                            </Stack>;
                        })}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#ffffff", p: 2 }}>
                    <Stack spacing={2}>
                        {dialogError && <Alert severity="error">{dialogError}</Alert>}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                            <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #1976d2" }}>
                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                    <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>• Bước 1 & 2: Chuyên khoa & Bác sĩ</Typography>
                                    <Typography variant="caption" color="text.secondary">Khu khám lầu 1 & 2</Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    <TextField select size="small" label="1. Chọn Chuyên khoa khám" value={dialogForm.departmentId} disabled={saving} required onChange={event => {
                                        setDoctors([]);
                                        setSlots([]);
                                        setDialogForm(current => ({ ...current, departmentId: event.target.value, doctorId: "", startTime: "" }));
                                    }}>
                                        <MenuItem value="">Chọn chuyên khoa</MenuItem>
                                        {departments.map(department => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}
                                    </TextField>
                                    <TextField select size="small" label="2. Chọn Bác sĩ phụ trách" value={dialogForm.doctorId} disabled={saving || !dialogForm.departmentId} required onChange={event => {
                                        setSlots([]);
                                        setDialogForm(current => ({ ...current, doctorId: event.target.value, startTime: "" }));
                                    }}>
                                        <MenuItem value="">Chọn bác sĩ</MenuItem>
                                        {doctors.map(doctor => <MenuItem key={doctor.doctorId} value={doctor.doctorId}>{doctor.title} {doctor.fullName}</MenuItem>)}
                                    </TextField>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 1, alignItems: "center", p: 1, bgcolor: "background.paper", borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Vị trí chỉ định:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedDoctor ? `Phòng khám • ${selectedDoctor.title} ${selectedDoctor.fullName}` : "Chưa chọn bác sĩ"}</Typography>
                                        <Chip size="small" color={selectedDoctor ? "success" : "default"} label={selectedDoctor ? "Sẵn sàng" : "Đang chờ"} />
                                    </Box>
                                </Stack>
                            </Box>
                            <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #2e7d32" }}>
                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                    <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>• Bước 3 & 4: Ngày & Khung giờ khám</Typography>
                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>• {slots.length} chỗ trống</Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>3. Ngày tiếp nhận khám *</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap", gap: 1 }}>
                                            {directDateOptions.map(option => <Button key={option.value} size="small" variant={dialogForm.appointmentDate === option.value ? "contained" : "outlined"} onClick={() => {
                                                setSlots([]);
                                                setDialogForm(current => ({ ...current, appointmentDate: option.value, startTime: "" }));
                                            }}>{option.label}</Button>)}
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>4. Khung giờ tiếp nhận *</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap", gap: 1 }}>
                                            {slots.slice(0, 8).map(slot => <Button key={slot.startTime} size="small" variant={dialogForm.startTime === slot.startTime ? "contained" : "outlined"} onClick={() => setDialogForm(current => ({ ...current, startTime: slot.startTime }))}>{formatTime(slot.startTime)}</Button>)}
                                            {!slots.length && <Chip size="small" color="warning" variant="outlined" label={dialogForm.doctorId ? "Không có khung giờ trống" : "Chọn bác sĩ để xem giờ"} />}
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                        <Typography variant="caption" color="text.secondary">Ca trực: Sáng 07:30 - 12:00</Typography>
                                        <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>Ưu tiên lượt khám trực tiếp tại quầy</Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>
                        <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #7b61ff" }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>• Bước 5: Thông tin bệnh nhân & Triệu chứng</Typography>
                                <Typography variant="caption" color="text.secondary">Kiểm tra CCCD / Thẻ BHYT tích hợp VNeID</Typography>
                            </Stack>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.25fr 1fr" }, gap: 1.5 }}>
                                <TextField size="small" label="Họ và tên bệnh nhân" value={dialogForm.patientName} disabled={saving} required slotProps={{ htmlInput: { maxLength: 100 } }} onChange={event => setDialogForm(current => ({ ...current, patientName: event.target.value }))} />
                                <TextField size="small" label="Số điện thoại liên hệ" value={dialogForm.patientPhone} disabled={saving} required slotProps={{ htmlInput: { maxLength: 15 } }} onChange={event => setDialogForm(current => ({ ...current, patientPhone: event.target.value }))} />
                                <TextField size="small" label="Ngày sinh" type="date" value={dialogForm.birthDate} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} onChange={event => setDialogForm(current => ({ ...current, birthDate: event.target.value }))} />
                                <TextField select size="small" label="Giới tính" value={dialogForm.gender} disabled={saving} onChange={event => setDialogForm(current => ({ ...current, gender: event.target.value }))}>
                                    <MenuItem value="">Chọn giới tính</MenuItem>
                                    <MenuItem value="Nam">Nam</MenuItem>
                                    <MenuItem value="Nữ">Nữ</MenuItem>
                                    <MenuItem value="Khác">Khác</MenuItem>
                                </TextField>
                                <TextField size="small" label="Số CCCD / Định danh (VNeID)" value={dialogForm.identityNumber} disabled={saving} slotProps={{ htmlInput: { maxLength: 20 } }} onChange={event => setDialogForm(current => ({ ...current, identityNumber: event.target.value }))} />
                                <TextField size="small" label="Mã thẻ BHYT" value={dialogForm.insuranceCode} disabled={saving} slotProps={{ htmlInput: { maxLength: 30 } }} onChange={event => setDialogForm(current => ({ ...current, insuranceCode: event.target.value }))} />
                                <TextField sx={{ gridColumn: { md: "1 / -1" } }} size="small" label="Lý do khám / Triệu chứng ban đầu" value={dialogForm.reason} disabled={saving} required multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} onChange={event => setDialogForm(current => ({ ...current, reason: event.target.value }))} />
                            </Box>
                        </Box>
                        <Box sx={{ ...DIRECT_FORM_CARD_SX, bgcolor: "#eef7ff", borderColor: "#b8d9fb", borderTop: "3px solid #0f6fbf" }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>▣ Bước 6: Tóm tắt phiếu khám & Cấp số thứ tự</Typography>
                                <Chip size="small" color="primary" variant="outlined" label="STT Khám: #WI-042" />
                            </Stack>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
                                <Box><Typography variant="caption" color="text.secondary">Chuyên khoa:</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedDepartment?.name || "Chưa chọn"}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">Bác sĩ & Phòng:</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.fullName}` : "Chưa chọn"}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">Thời gian hẹn:</Typography><Typography variant="body2" color="primary" sx={{ fontWeight: 800 }}>{selectedSlot ? `${formatTime(selectedSlot.startTime)} ${formatDate(dialogForm.appointmentDate)}` : "Chưa chọn"}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">Phí khám lâm sàng:</Typography><Typography variant="body2" color="error" sx={{ fontWeight: 800 }}>350.000 VNĐ</Typography></Box>
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "space-between", bgcolor: "#f3f7fb", px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary">Đã liên kết hồ sơ y bạ điện tử MediFlow EMR</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button disabled={saving} onClick={() => setAction(null)}>Hủy</Button>
                        <Button variant="contained" startIcon={<CheckCircleOutlineOutlined />} disabled={saving || createDisabled} onClick={submitAction}>{saving ? "Đang xác nhận..." : "Xác nhận"}</Button>
                    </Stack>
                </DialogActions>
            </> : <>
                <DialogTitle>{actionTitle}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {dialogError && <Alert severity="error">{dialogError}</Alert>}
                        {action?.appointment && <Box>
                            <Typography sx={{ fontWeight: 700 }}>{action.appointment.patientName}</Typography>
                            <Typography variant="body2" color="text.secondary">{formatDate(action.appointment.appointmentDate)} · {formatTime(action.appointment.startTime)} · {action.appointment.doctorName}</Typography>
                        </Box>}
                        {action?.type === "confirm" && <Typography color="text.secondary">Lịch hẹn sẽ chuyển sang trạng thái đã xác nhận để bệnh nhân đến khám đúng giờ.</Typography>}
                        {action?.type === "cancel" && <Typography color="text.secondary">Lịch hẹn bị hủy sẽ nhả khung giờ để bệnh nhân khác có thể đặt lại.</Typography>}
                        {action?.type === "reschedule" && <>
                            <TextField select label="Khoa" value={dialogForm.departmentId} disabled={saving} onChange={event => {
                                setDoctors([]);
                                setSlots([]);
                                setDialogForm(current => ({ ...current, departmentId: event.target.value, doctorId: "", startTime: "" }));
                            }}>
                                <MenuItem value="">Chọn khoa</MenuItem>
                                {departments.map(department => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}
                            </TextField>
                            <TextField select label="Bác sĩ" value={dialogForm.doctorId} disabled={saving || !dialogForm.departmentId} onChange={event => {
                                setSlots([]);
                                setDialogForm(current => ({ ...current, doctorId: event.target.value, startTime: "" }));
                            }}>
                                <MenuItem value="">Chọn bác sĩ</MenuItem>
                                {doctors.map(doctor => <MenuItem key={doctor.doctorId} value={doctor.doctorId}>{doctor.title} {doctor.fullName}</MenuItem>)}
                            </TextField>
                            <TextField label="Ngày khám" type="date" value={dialogForm.appointmentDate} disabled={saving} onChange={event => {
                                setSlots([]);
                                setDialogForm(current => ({ ...current, appointmentDate: event.target.value, startTime: "" }));
                            }} slotProps={{ inputLabel: { shrink: true } }} />
                            <TextField select label="Khung giờ còn trống" value={dialogForm.startTime} disabled={saving || !slots.length} onChange={event => setDialogForm(current => ({ ...current, startTime: event.target.value }))}>
                                <MenuItem value="">Chọn giờ khám</MenuItem>
                                {slots.map(slot => <MenuItem key={slot.startTime} value={slot.startTime}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</MenuItem>)}
                            </TextField>
                            {dialogForm.doctorId && dialogForm.appointmentDate && !slots.length && <Chip size="small" color="warning" variant="outlined" label="Không có khung giờ trống cho ngày đã chọn" />}
                        </>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} onClick={() => setAction(null)}>Đóng</Button>
                    <Button variant="contained" color={action?.type === "cancel" ? "error" : "primary"} disabled={saving || (action?.type === "reschedule" && scheduleDisabled)} onClick={submitAction}>
                        {saving ? "Đang lưu..." : "Xác nhận"}
                    </Button>
                </DialogActions>
            </>}
        </Dialog>
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
    </Stack>;
}
