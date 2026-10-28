import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, LinearProgress, MenuItem, Paper, Skeleton, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { AddCircleOutlineOutlined, AssignmentTurnedInOutlined, CalendarMonthOutlined, CancelOutlined, CheckCircleOutlineOutlined, EditCalendarOutlined, RefreshOutlined, SearchOutlined } from "@mui/icons-material";
import { cancelAppointment, confirmAppointment, createDirectAppointment, getAppointments, rescheduleAppointment } from "../../api/appointmentApi";
import ReceptionAppointmentDialog from "../../components/internal/ReceptionAppointmentDialog";
import ReceptionCheckInDialog from "../../components/internal/ReceptionCheckInDialog";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import StatusBadge from "../../components/common/StatusBadge";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { formatDate } from "../../utils/formatDate";
import useNotifications from "../../hooks/useNotifications";
import { appointmentButtonSx, appointmentColors, appointmentFieldSx, appointmentHeadingSx, appointmentPageSx, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx, appointmentSurfaceSx, appointmentTableSx } from "../../components/appointments/appointmentUi";

const STATUS_OPTIONS = [
    { value: "Pending", label: "Chờ xác nhận" },
    { value: "Confirmed", label: "Đã xác nhận" },
    { value: "InProgress", label: "Đang khám" },
    { value: "Completed", label: "Hoàn tất" },
    { value: "Cancelled", label: "Đã hủy" },
];

const ACTION_BUTTON_SX = {
    ...appointmentButtonSx,
    minWidth: 88,
    justifyContent: "flex-start",
    px: 1,
    color: appointmentColors.primary,
    "& .MuiButton-startIcon": {
        ml: 0,
        mr: 0.75,
    },
    "&:hover": {
        bgcolor: appointmentColors.primarySoft,
    },
};

const FILTER_FIELD_SX = appointmentFieldSx;

function toDateInput(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

function formatTime(value) {
    if (!value) return "--:--";
    return String(value).slice(0, 5);
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
    const { revision, availabilityRevision, appointmentEvent } = useNotifications();
    const appointmentRequest = useRef(0);
    const summaryRequest = useRef(0);
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    const [query, setQuery] = useState({ pageNumber: 1, pageSize: 10, search: "", status: "", doctorId: "", dateFrom: today, dateTo: "" });
    const [search, setSearch] = useState("");
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [summary, setSummary] = useState({
        total: 0,
        Pending: 0,
        Confirmed: 0,
        Cancelled: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState("");
    const [catalogError, setCatalogError] = useState("");
    const [catalogReload, setCatalogReload] = useState(0);
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
    const [filterDoctors, setFilterDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [dialogForm, setDialogForm] = useState(emptyDialogForm);
    const [toast, setToast] = useState({ open: false, status: "success", message: "" });
    const [checkInAppointment, setCheckInAppointment] = useState(null);
    const dateError = query.dateFrom && query.dateTo && query.dateFrom > query.dateTo
        ? "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu." : "";

    useEffect(() => {
        if (!appointmentEvent) return;
        const timer = setTimeout(() => setCheckInAppointment(current =>
            current?.appointmentId === appointmentEvent.appointmentId ? { ...current, ...appointmentEvent } : current), 0);
        return () => clearTimeout(timer);
    }, [appointmentEvent]);

    function changeFilter(key, value) {
        setSelectedIds([]);
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
        const requestId = ++appointmentRequest.current;
        setLoading(true);
        setError("");
        if (dateError) {
            setItems([]);
            setTotalItems(0);
            setSelectedIds([]);
            setLoading(false);
            return;
        }
        try {
            const data = await getAppointments({
                pageNumber: query.pageNumber,
                pageSize: query.pageSize,
                search: query.search || undefined,
                status: query.status || undefined,
                dateFrom: query.dateFrom || undefined,
                dateTo: query.dateTo || undefined,
                doctorId: query.doctorId || undefined,
            }, signal);
            if (signal?.aborted || requestId !== appointmentRequest.current) return;
            const lastPage = Math.max(1, Math.ceil((data.totalItems || 0) / query.pageSize));
            if (query.pageNumber > lastPage) {
                setItems([]);
                setTotalItems(data.totalItems || 0);
                setQuery(current => ({ ...current, pageNumber: lastPage }));
                return;
            }
            setItems(data.items || []);
            setTotalItems(data.totalItems || 0);
            setSelectedIds(current => current.filter(id =>
                (data.items || []).some(item => item.appointmentId === id && item.status === "Pending")
            ));
        } catch (err) {
            if (err.name !== "CanceledError" && !signal?.aborted && requestId === appointmentRequest.current) {
                setItems([]);
                setTotalItems(0);
                setSelectedIds([]);
                setError(getApiErrorMessage(err));
            }
        } finally {
            if (!signal?.aborted && requestId === appointmentRequest.current) setLoading(false);
        }
    }, [query, dateError]);

    const loadSummary = useCallback(async (signal) => {
        const requestId = ++summaryRequest.current;
        setSummaryLoading(true);
        setSummaryError("");
        if (dateError) {
            setSummaryLoading(false);
            return;
        }
        try {
            const filters = { pageNumber: 1, pageSize: 1, search: query.search || undefined,
                dateFrom: query.dateFrom || undefined, dateTo: query.dateTo || undefined,
                doctorId: query.doctorId || undefined, status: query.status || undefined };
            const countStatus = status => query.status && query.status !== status
                ? Promise.resolve({ totalItems: 0 }) : getAppointments({ ...filters, status }, signal);
            const [all, pending, confirmed, cancelled] = await Promise.all([
                getAppointments(filters, signal), countStatus("Pending"), countStatus("Confirmed"), countStatus("Cancelled"),
            ]);
            if (signal?.aborted || requestId !== summaryRequest.current) return;
            setSummary({
                total: all.totalItems || 0, Pending: pending.totalItems || 0,
                Confirmed: confirmed.totalItems || 0, Cancelled: cancelled.totalItems || 0,
            });
        } catch (err) {
            if (!signal?.aborted && requestId === summaryRequest.current)
                setSummaryError(getApiErrorMessage(err, "Không thể tải số lượng lịch hẹn."));
        } finally {
            if (!signal?.aborted && requestId === summaryRequest.current) setSummaryLoading(false);
        }
    }, [query.search, query.status, query.dateFrom, query.dateTo, query.doctorId, dateError]);

    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => loadAppointments(controller.signal));
        return () => { controller.abort(); appointmentRequest.current += 1; };
    }, [loadAppointments, revision]);

    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => loadSummary(controller.signal));
        return () => { controller.abort(); summaryRequest.current += 1; };
    }, [loadSummary, revision]);

    useEffect(() => {
        let active = true;
        getDepartments().then(async result => {
            if (!active) return;
            setDepartments(result);
            const doctorLists = await Promise.all(result.map(department => getDoctorsByDepartment(department.departmentId)));
            if (active) {
                setFilterDoctors(doctorLists.flat().sort((left, right) => left.fullName.localeCompare(right.fullName, "vi")));
                setCatalogError("");
            }
        })
            .catch(err => { if (active) setCatalogError(getApiErrorMessage(err, "Không thể tải danh mục khoa và bác sĩ.")); });
        return () => { active = false; };
    }, [catalogReload]);

    useEffect(() => {
        if (!dialogForm.departmentId || !["create", "reschedule"].includes(action?.type)) return;
        let active = true;
        getDoctorsByDepartment(dialogForm.departmentId)
            .then(result => { if (active) setDoctors(result); })
            .catch(err => {
                if (active) {
                    setDoctors([]);
                    setDialogError(getApiErrorMessage(err));
                }
            });
        return () => { active = false; };
    }, [dialogForm.departmentId, action?.type]);

    useEffect(() => {
        if (!dialogForm.doctorId || !dialogForm.appointmentDate || !["create", "reschedule"].includes(action?.type)) {
            let active = true;
            Promise.resolve().then(() => { if (active) setSlotsLoading(false); });
            return () => { active = false; };
        }
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            setSlotsLoading(true);
            return getAvailableSlots(dialogForm.doctorId, dialogForm.appointmentDate)
                .then(result => {
                    if (!active) return;
                    const available = result.filter(slot => slot.isAvailable);
                    setSlots(available);
                    setDialogForm(current => current.startTime && !available.some(slot => slot.startTime === current.startTime)
                        ? { ...current, startTime: "" } : current);
                })
                .catch(err => { if (active) {
                    setSlots([]);
                    setDialogForm(current => ({ ...current, startTime: "" }));
                    setDialogError(getApiErrorMessage(err));
                } })
                .finally(() => { if (active) setSlotsLoading(false); });
        });
        return () => { active = false; };
    }, [dialogForm.doctorId, dialogForm.appointmentDate, availabilityRevision, action?.type]);

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
                    patientProfileId: dialogForm.patientProfileId ? Number(dialogForm.patientProfileId) : null,
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
            const results = await Promise.allSettled(selectedPendingItems.map(appointment =>
                confirmAppointment(appointment.appointmentId)));
            const failed = results.flatMap((result, index) => result.status === "rejected"
                ? [{ id: selectedPendingItems[index].appointmentId, error: result.reason }] : []);
            const succeeded = results.length - failed.length;
            setSelectedIds(failed.map(item => item.id));
            await Promise.all([loadAppointments(), loadSummary()]);
            setToast({
                open: true,
                status: failed.length ? (succeeded ? "warning" : "error") : "success",
                message: failed.length
                    ? `Đã xác nhận ${succeeded}/${results.length} lịch hẹn. ${getApiErrorMessage(failed[0].error)}`
                    : `Đã xác nhận ${succeeded} lịch hẹn.`,
            });
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

    return <Stack className="appointment-workspace" spacing={2.5} sx={appointmentPageSx}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
                <Box>
                    <Typography component="h1" sx={appointmentHeadingSx}>Điều phối & Xác nhận lịch hẹn</Typography>
                    <Typography sx={{ mt: 0.75, color: appointmentColors.muted, fontSize: 14, maxWidth: 620 }}>Xác nhận lịch online, đổi/hủy khi cần và tiếp nhận bệnh nhân vãng lai tại quầy.</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={openCreate} disabled={bulkSaving} sx={appointmentPrimaryButtonSx}>Đặt lịch trực tiếp</Button>
                    <Button aria-label="Tải lại lịch hẹn" variant="outlined" startIcon={<RefreshOutlined />} onClick={() => { void loadAppointments(); void loadSummary(); }} disabled={loading || summaryLoading} sx={appointmentSecondaryButtonSx}>Tải lại</Button>
                </Stack>
            </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            borderTop: "1px solid", borderBottom: "1px solid", borderColor: appointmentColors.border, py: 1.5, gap: 2 }}>
            {[
                { key: "total", label: "Tổng lịch trong bộ lọc", color: appointmentColors.heading },
                { key: "Pending", label: "Chờ xác nhận", color: appointmentColors.warning },
                { key: "Confirmed", label: "Đã xác nhận", color: appointmentColors.success },
                { key: "Cancelled", label: "Đã hủy", color: appointmentColors.danger },
            ].map(stat => <Box key={stat.key} sx={{ minWidth: 0 }}>
                <Typography sx={{ color: appointmentColors.muted, fontSize: 13 }}>{stat.label}</Typography>
                <Typography className="appointment-numeric" sx={{ mt: 0.25, color: stat.color, fontSize: 28, lineHeight: 1.3, fontWeight: 600 }}>
                    {summaryLoading ? <Skeleton width={44} /> : summaryError || dateError ? "—" : summary[stat.key]}
                </Typography>
            </Box>)}
        </Box>

        {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
        {error && <Alert severity="error" action={<Button onClick={() => loadAppointments()}>Thử lại</Button>}>{error}</Alert>}
        {summaryError && <Alert severity="warning" action={<Button disabled={summaryLoading} onClick={() => loadSummary()}>Tải lại thống kê</Button>}>{summaryError}</Alert>}
        {catalogError && <Alert severity="warning" action={<Button onClick={() => setCatalogReload(value => value + 1)}>Tải lại danh mục</Button>}>{catalogError}</Alert>}

        <Paper variant="outlined" sx={{ ...appointmentSurfaceSx, overflow: "clip" }}>
            <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: "1px solid", borderColor: appointmentColors.borderSoft }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}>
                    <Box>
                        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: appointmentColors.heading }}>Danh sách lịch hẹn</Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, color: appointmentColors.muted }}>{loading ? "Đang tải lịch hẹn..." : `Hiển thị ${items.length} / ${totalItems} lịch theo bộ lọc hiện tại`}</Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                        <Button variant="contained" sx={appointmentPrimaryButtonSx} startIcon={<CheckCircleOutlineOutlined />} disabled={!selectedPendingItems.length || bulkSaving || loading} onClick={confirmSelectedAppointments}>
                            {bulkSaving ? "Đang xác nhận..." : `Xác nhận hàng loạt${selectedPendingItems.length ? ` (${selectedPendingItems.length})` : ""}`}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
            <Box component="form" onSubmit={event => { event.preventDefault(); changeFilter("search", search.trim()); }} sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: appointmentColors.canvas }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) auto" }, gap: 1.5, mb: 2 }}>
                <TextField label="Tìm lịch hẹn" placeholder="Tên, SĐT, bác sĩ hoặc lý do" value={search} onChange={event => setSearch(event.target.value)} size="small" sx={{ minWidth: 0, ...FILTER_FIELD_SX }} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <Button type="submit" variant="contained" startIcon={<SearchOutlined />} sx={appointmentPrimaryButtonSx}>Tìm kiếm</Button>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr)) auto" }, gap: 1.5, alignItems: "start" }}>
                <TextField select label="Trạng thái" value={query.status} onChange={event => changeFilter("status", event.target.value)} size="small" sx={{ minWidth: 0, ...FILTER_FIELD_SX }}>
                    <MenuItem value="">Tất cả trạng thái</MenuItem>
                    {STATUS_OPTIONS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField select label="Bác sĩ" value={query.doctorId} onChange={event => changeFilter("doctorId", event.target.value)} size="small" sx={{ minWidth: 0, ...FILTER_FIELD_SX }}>
                    <MenuItem value="">Tất cả bác sĩ</MenuItem>
                    {filterDoctors.map(doctor => <MenuItem key={doctor.doctorId} value={doctor.doctorId}>{doctor.fullName}</MenuItem>)}
                </TextField>
                <TextField label="Từ ngày" type="date" value={query.dateFrom} onChange={event => changeFilter("dateFrom", event.target.value)} size="small" sx={{ minWidth: 0, ...FILTER_FIELD_SX }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: query.dateTo || undefined } }} />
                <TextField label="Đến ngày" type="date" value={query.dateTo} error={Boolean(dateError)} onChange={event => changeFilter("dateTo", event.target.value)} size="small" sx={{ minWidth: 0, ...FILTER_FIELD_SX }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: query.dateFrom || undefined } }} />
                <Button sx={appointmentButtonSx} onClick={() => { setSearch(""); setSelectedIds([]); setQuery(current => ({ ...current, search: "", status: "", doctorId: "", dateFrom: "", dateTo: "", pageNumber: 1 })); }}>Xóa bộ lọc</Button>
            </Box>
            {dateError && <Alert severity="warning" sx={{ mt: 1.5 }}>{dateError}</Alert>}
            </Box>

            {loading && <LinearProgress aria-label="Đang tải lịch hẹn" />}

            <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
                <Table role="table" aria-label="Danh sách lịch hẹn" aria-busy={loading} sx={{
                    ...appointmentTableSx,
                    minWidth: { xs: 0, md: 980 }, display: { xs: "block", md: "table" },
                    "& .MuiTableHead-root, & .MuiTableBody-root": { display: { xs: "block", md: "table-row-group" } },
                    "& .MuiTableHead-root .MuiTableRow-root": { display: { xs: "block", md: "table-row" } },
                    "& .MuiTableHead-root .MuiTableCell-root": { display: { xs: "none", md: "table-cell" } },
                    "& .MuiTableHead-root .MuiTableCell-root:first-of-type": { display: { xs: "flex", md: "table-cell" }, alignItems: "center", gap: 1, width: { xs: "auto", md: 48 } },
                    "& .MuiTableBody-root .MuiTableRow-root": {
                        display: { xs: "grid", md: "table-row" }, gridTemplateColumns: "32px minmax(0, 1fr)",
                        height: { xs: "auto", md: 52 }, gap: 1.5, p: { xs: 2, md: 0 },
                        borderBottom: { xs: `1px solid ${appointmentColors.borderSoft}`, md: "none" },
                    },
                    "& .MuiTableBody-root .MuiTableCell-root": {
                        display: { xs: "block", md: "table-cell" }, gridColumn: "1 / -1", minWidth: 0,
                        borderBottom: { xs: 0, md: `1px solid ${appointmentColors.borderSoft}` },
                        px: { xs: 0, md: 2 }, py: { xs: 0, md: 1.5 }, overflowWrap: "anywhere",
                    },
                    "& .MuiTableBody-root .MuiTableCell-paddingCheckbox": { gridColumn: 1, gridRow: 1, width: { xs: 32, md: 48 } },
                    "& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)": { gridColumn: 2, gridRow: 1 },
                    "& .MuiTableBody-root .MuiTableCell-root[data-label]": {
                        display: { xs: "grid", md: "table-cell" }, gridTemplateColumns: "86px minmax(0, 1fr)", gap: 1,
                        "&::before": { content: { xs: "attr(data-label)", md: "none" }, color: appointmentColors.muted, fontSize: 13, pt: 0.25 },
                    },
                }}>
                    <TableHead role="rowgroup">
                        <TableRow role="row">
                            <TableCell role="columnheader" padding="checkbox">
                                <Checkbox
                                    aria-label="Chọn tất cả lịch chờ xác nhận"
                                    checked={allPendingSelected}
                                    indeterminate={somePendingSelected}
                                    disabled={!pendingItems.length || loading || bulkSaving}
                                    onChange={event => toggleSelectAllPending(event.target.checked)}
                                />
                                <Typography component="span" sx={{ display: { xs: "inline", md: "none" }, fontSize: 13 }}>Chọn tất cả lịch chờ xác nhận</Typography>
                            </TableCell>
                            {["Bệnh nhân", "Lịch khám", "Bác sĩ", "Lý do", "Trạng thái", "Thao tác"].map(label => <TableCell role="columnheader" key={label}>{label}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody role="rowgroup">
                        {loading ? Array.from({ length: 4 }, (_, index) => <TableRow role="row" key={index}>
                            <TableCell role="cell" padding="checkbox"><Skeleton width={20} /></TableCell>
                            {Array.from({ length: 6 }, (_, column) => <TableCell role="cell" key={column}><Skeleton width={column === 5 ? 160 : 100} /></TableCell>)}
                        </TableRow>) : items.map(appointment => <TableRow role="row" key={appointment.appointmentId} hover>
                            <TableCell role="cell" padding="checkbox">
                                <Checkbox
                                    aria-label={`Chọn lịch hẹn của ${appointment.patientName}`}
                                    checked={selectedIds.includes(appointment.appointmentId)}
                                    disabled={appointment.status !== "Pending" || loading || bulkSaving}
                                    onChange={event => toggleSelectAppointment(appointment.appointmentId, event.target.checked)}
                                />
                            </TableCell>
                            <TableCell role="cell">
                                <Typography sx={{ fontWeight: 700 }}>{appointment.patientName}</Typography>
                                <Typography variant="body2" color="text.secondary">{appointment.patientPhone}</Typography>
                            </TableCell>
                            <TableCell role="cell" data-label="Lịch khám">
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <CalendarMonthOutlined fontSize="small" color="primary" />
                                    <Box>
                                        <Typography sx={{ whiteSpace: "nowrap" }}>{formatDate(appointment.appointmentDate)}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</Typography>
                                    </Box>
                                </Stack>
                            </TableCell>
                            <TableCell role="cell" data-label="Bác sĩ">
                                <Box>
                                <Typography>{appointment.doctorName}</Typography>
                                <Typography variant="body2" color="text.secondary">{appointment.departmentName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell role="cell" data-label="Lý do" sx={{ maxWidth: { xs: "none", md: 260 } }}>
                                <Typography variant="body2" sx={{ whiteSpace: "normal" }}>{appointment.reason}</Typography>
                            </TableCell>
                            <TableCell role="cell" data-label="Trạng thái"><Box><StatusBadge status={appointment.status} /></Box></TableCell>
                            <TableCell role="cell">
                                <Stack direction="row" spacing={1} useFlexGap sx={{ display: { xs: "grid", md: "flex" }, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", flexWrap: "wrap" }}>
                                    <Button size="small" sx={ACTION_BUTTON_SX} startIcon={<CheckCircleOutlineOutlined />} disabled={appointment.status !== "Pending" || bulkSaving} onClick={() => openConfirm(appointment)}>Xác nhận</Button>
                                    <Button size="small" sx={ACTION_BUTTON_SX} startIcon={<EditCalendarOutlined />} disabled={["Cancelled", "Completed", "InProgress"].includes(appointment.status) || Boolean(appointment.checkedInAt) || bulkSaving} onClick={() => openReschedule(appointment)}>Đổi lịch</Button>
                                    <Button size="small" sx={{ ...ACTION_BUTTON_SX, color: appointmentColors.danger }} color="error" startIcon={<CancelOutlined />} disabled={["Cancelled", "Completed", "InProgress"].includes(appointment.status) || Boolean(appointment.checkedInAt) || bulkSaving} onClick={() => openCancel(appointment)}>Hủy</Button>
                                    <Button size="small" sx={ACTION_BUTTON_SX} startIcon={<AssignmentTurnedInOutlined />} disabled={appointment.status !== "Confirmed" || Boolean(appointment.checkedInAt) || toDateInput(appointment.appointmentDate) !== today || bulkSaving} onClick={() => setCheckInAppointment(appointment)}>Check-in</Button>
                                    {appointment.checkedInAt && <Chip size="small" color="success" label="Đã check-in" />}
                                </Stack>
                            </TableCell>
                        </TableRow>)}
                        {!loading && !items.length && <TableRow role="row"><TableCell role="cell" colSpan={7} align="center" sx={{ py: 6, color: appointmentColors.muted }}>
                            {error ? "Không thể tải danh sách lịch hẹn. Chọn Thử lại để tiếp tục." : dateError ? "Điều chỉnh khoảng ngày để xem lịch hẹn." : "Không tìm thấy lịch hẹn phù hợp."}
                        </TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination component="div" count={totalItems} page={query.pageNumber - 1} rowsPerPage={query.pageSize} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Số dòng" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`} onPageChange={(_, page) => setQuery(current => ({ ...current, pageNumber: page + 1 }))} onRowsPerPageChange={event => setQuery(current => ({ ...current, pageNumber: 1, pageSize: Number(event.target.value) }))} />
        </Paper>

        <ReceptionAppointmentDialog action={action} form={dialogForm} setForm={setDialogForm}
            departments={departments} doctors={doctors} slots={slots} setDoctors={setDoctors} setSlots={setSlots}
            slotsLoading={slotsLoading} saving={saving} error={dialogError} today={today}
            onClose={() => setAction(null)} onSubmit={submitAction} />
        {checkInAppointment && <ReceptionCheckInDialog appointment={items.find(item => item.appointmentId === checkInAppointment.appointmentId) || checkInAppointment}
            onClose={() => setCheckInAppointment(null)} onCheckedIn={async () => {
                setCheckInAppointment(null);
                setNotice("Đã check-in sau khi kiểm tra sổ khám.");
                await loadAppointments();
            }} />}
        <Snackbar
            open={toast.open}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            autoHideDuration={toast.status === "loading" ? null : 3000}
            onClose={() => {
                if (toast.status !== "loading") setToast(current => ({ ...current, open: false }));
            }}
        >
            <Alert
                severity={toast.status === "loading" ? "info" : toast.status}
                variant="filled"
                icon={toast.status === "loading" ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ alignItems: "center", minWidth: 0, maxWidth: { xs: "100%", sm: 460 } }}
            >
                {toast.message}
            </Alert>
        </Snackbar>
    </Stack>;
}
