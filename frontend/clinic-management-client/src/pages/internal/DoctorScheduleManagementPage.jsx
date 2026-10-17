import { Fragment, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AddOutlined, CalendarMonthOutlined, ChevronLeft, ChevronRight, CloseOutlined, EventAvailableOutlined, FilterListOutlined, LocalHospitalOutlined, RefreshOutlined, RestartAltOutlined, SaveOutlined, ScheduleOutlined } from "@mui/icons-material";
import catalogApi from "../../api/catalogApi";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import { clinicButtonSx, clinicColors, clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx, clinicSurfaceSx, clinicTableSx } from "../../components/common/clinicUi";
import { addDays, clinicToday, formatDay, parseDate } from "../../utils/scheduleCalendar";
import { getApiErrorMessage } from "../../utils/errorHandler";

const shifts = ["Sáng", "Chiều", "Tối"];
const initialForm = () => ({ doctorId: "", roomId: "", workDate: clinicToday(), shift: 0, startTime: "08:00", endTime: "11:30", slotDurationMinutes: 30, maxCapacity: 1 });

function ScheduleCard({ schedule, onSelect }) {
    return <Button onClick={() => onSelect(schedule)} aria-label={`Xem ca ${schedule.doctorName}, ${formatDay(schedule.workDate)}`} sx={{
        width: "100%", textAlign: "left", justifyContent: "flex-start", p: 1.5, borderRadius: 2, border: "1px solid #BAE6FD",
        bgcolor: "#F0F9FF", color: clinicColors.heading, textTransform: "none", "&:hover": { bgcolor: "#E0F2FE", borderColor: "#7DD3FC" },
    }}><Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, overflowWrap: "anywhere" }}>{schedule.doctorName}</Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: clinicColors.muted }}><LocalHospitalOutlined sx={{ fontSize: 14 }} /><Typography sx={{ fontSize: 12 }}>{schedule.roomName}</Typography></Stack>
        <Typography sx={{ fontSize: 12, color: "#0369A1" }}>{schedule.bookedSlots}/{schedule.totalSlots} khung giờ đã đầy</Typography>
    </Stack></Button>;
}

export default function DoctorScheduleManagementPage() {
    const [weekStart, setWeekStart] = useState(clinicToday);
    const [specializationId, setSpecializationId] = useState("");
    const [revision, setRevision] = useState(0);
    const [list, setList] = useState(null);
    const [catalogs, setCatalogs] = useState(null);
    const [doctorResult, setDoctorResult] = useState(null);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const queryKey = JSON.stringify([weekStart, specializationId, revision]);
    const visible = list?.key === queryKey ? list : null;
    const loading = !visible;
    const schedules = visible?.items || [];
    const specializations = catalogs?.specializations || [];
    const rooms = catalogs?.rooms || [];
    const specialization = specializations.find(item => String(item.id) === specializationId);
    const departmentId = specialization?.departmentId;
    const doctors = departmentId && doctorResult?.departmentId === departmentId ? doctorResult.items || [] : [];
    const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
    const refresh = () => setRevision(value => value + 1);

    useEffect(() => {
        let active = true;
        Promise.all([
            catalogApi.list("specializations", { pageNumber: 1, pageSize: 100, isActive: true }),
            catalogApi.list("rooms", { pageNumber: 1, pageSize: 100, isActive: true }),
        ]).then(([specializationResponse, roomResponse]) => {
            if (active) setCatalogs({
                specializations: (doctorScheduleApi.unwrap(specializationResponse).items ?? []).map(item => ({ id: item.specializationId ?? 0, name: item.name, departmentId: item.departmentId })),
                rooms: (doctorScheduleApi.unwrap(roomResponse).items ?? []).map(item => ({ id: item.roomId ?? 0, name: item.name })),
            });
        }).catch(error => { if (active) setCatalogs({ error: getApiErrorMessage(error) }); });
        return () => { active = false; };
    }, [revision]);
    useEffect(() => {
        let active = true;
        doctorScheduleApi.list({ weekStart, specializationId: specializationId || undefined, pageSize: 100 })
            .then(response => { if (active) setList({ key: queryKey, items: doctorScheduleApi.unwrap(response).items }); })
            .catch(error => { if (active) setList({ key: queryKey, error: getApiErrorMessage(error) }); });
        return () => { active = false; };
    }, [weekStart, specializationId, queryKey]);
    useEffect(() => {
        if (!departmentId) return;
        let active = true;
        doctorScheduleApi.doctors(departmentId).then(response => {
            if (active) setDoctorResult({ departmentId, items: (doctorScheduleApi.unwrap(response) ?? []).map(doctor => ({ id: doctor.doctorId, name: doctor.fullName })) });
        }).catch(error => { if (active) setDoctorResult({ departmentId, error: getApiErrorMessage(error) }); });
        return () => { active = false; };
    }, [departmentId, revision]);

    const submit = async event => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setActionError("");
        try {
            await doctorScheduleApi.create(form);
            setOpen(false);
            setSuccess("Đã lưu lịch làm việc của bác sĩ.");
            refresh();
        } catch (error) { setActionError(getApiErrorMessage(error)); }
        finally { setSaving(false); }
    };
    const updateForm = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
    const openCreate = () => { setForm(initialForm()); setActionError(""); setSuccess(""); setOpen(true); };

    return <Stack spacing={2.5} sx={{ pb: 4, minWidth: 0 }}>
        <ClinicPageHeader title="Lịch làm việc bác sĩ" description="Theo dõi ca làm việc, phòng khám và các khung giờ trong 7 ngày. Chọn chuyên khoa để thêm ca cho bác sĩ." icon={CalendarMonthOutlined}
            actions={<Button variant="contained" startIcon={<AddOutlined />} sx={clinicPrimaryButtonSx} onClick={openCreate}>Thêm lịch trực</Button>} />
        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>}
        {catalogs?.error && <Alert severity="error">{catalogs.error}</Alert>}
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}><FilterListOutlined sx={{ fontSize: 18, color: clinicColors.muted }} /><Typography sx={{ fontSize: 14, fontWeight: 600 }}>Bộ lọc lịch làm việc</Typography></Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select fullWidth size="small" label="Chuyên khoa" value={specializationId} onChange={event => setSpecializationId(String(event.target.value))} sx={{ ...clinicFieldSx, flex: 1.3 }}>
                    <MenuItem value="">Tất cả chuyên khoa</MenuItem>{specializations.map(item => <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>)}
                </TextField>
                <TextField fullWidth size="small" type="date" label="Tuần bắt đầu" value={weekStart} onChange={event => { if (event.target.value) setWeekStart(event.target.value); }} slotProps={{ inputLabel: { shrink: true } }} sx={{ ...clinicFieldSx, flex: 1 }} />
                <Button onClick={() => { setSpecializationId(""); setWeekStart(clinicToday()); }} startIcon={<RestartAltOutlined />} sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}>Đặt lại bộ lọc</Button>
                <Button variant="outlined" onClick={refresh} disabled={loading} startIcon={<RefreshOutlined />} sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}>Làm mới dữ liệu</Button>
            </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2.5, alignItems: { sm: "center" }, justifyContent: "space-between", borderBottom: "1px solid #E2E8F0" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><EventAvailableOutlined sx={{ color: clinicColors.primary, fontSize: 20 }} /><Typography sx={{ fontWeight: 600 }}>Ca trong khoảng ngày đã chọn</Typography>{!loading && !visible?.error && <Chip size="small" label={`${schedules.length} ca`} sx={{ bgcolor: "#F0F9FF", color: "#0369A1" }} />}</Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Tooltip title="Tuần trước"><IconButton aria-label="Tuần trước" size="small" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft /></IconButton></Tooltip>
                    <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>{parseDate(days[0]).toLocaleDateString("vi-VN")} – {parseDate(days[6]).toLocaleDateString("vi-VN")}</Typography>
                    <Tooltip title="Tuần sau"><IconButton aria-label="Tuần sau" size="small" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight /></IconButton></Tooltip>
                </Stack>
            </Stack>
            {loading && <LinearProgress aria-label="Đang tải lịch bác sĩ" />}
            {visible?.error ? <Box sx={{ p: 3 }}><Alert severity="error" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{visible.error}</Alert></Box> : !loading && !schedules.length ? <EmptyState message="Chưa có ca làm việc trong khoảng ngày này. Hãy đổi ngày hoặc chuyên khoa để tìm lịch." /> : <>
                <Box sx={{ display: { xs: "none", lg: "grid" }, gridTemplateColumns: "76px repeat(7, minmax(0, 1fr))" }}>
                    <Box sx={{ p: 2, bgcolor: clinicColors.subtle, fontSize: 13, color: clinicColors.muted }}>Ca</Box>
                    {days.map(day => <Box key={day} sx={{ py: 2, px: 1, bgcolor: clinicColors.subtle, borderLeft: "1px solid #E2E8F0", textAlign: "center" }}><Typography sx={{ fontSize: 12, color: clinicColors.muted }}>{parseDate(day).toLocaleDateString("vi-VN", { weekday: "short" })}</Typography><Typography sx={{ fontSize: 14, fontWeight: 600, mt: 0.25 }}>{parseDate(day).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</Typography></Box>)}
                    {shifts.map((shift, shiftIndex) => <Fragment key={shift}>
                        <Box sx={{ p: 2, fontSize: 13, fontWeight: 600, color: clinicColors.muted, borderTop: "1px solid #E2E8F0" }}>{shift}</Box>
                        {days.map(day => <Stack key={day} spacing={1} sx={{ p: 1, minHeight: 110, borderLeft: "1px solid #E2E8F0", borderTop: "1px solid #E2E8F0" }}>
                            {loading ? <Skeleton variant="rounded" height={80} /> : schedules.filter(item => item.workDate === day && item.shift === shiftIndex).length ? schedules.filter(item => item.workDate === day && item.shift === shiftIndex).map(item => <ScheduleCard key={item.scheduleId} schedule={item} onSelect={setSelectedSchedule} />) : <Typography sx={{ fontSize: 12, color: "#94A3B8", p: 1 }}>Chưa có ca</Typography>}
                        </Stack>)}
                    </Fragment>)}
                </Box>
                <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, p: 2 }}>
                    {days.map(day => <Box key={day}><Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>{formatDay(day)}</Typography>
                        <Stack spacing={1}>{loading ? <Skeleton variant="rounded" height={88} /> : schedules.filter(item => item.workDate === day).length ? schedules.filter(item => item.workDate === day).map(item => <Box key={item.scheduleId}><Typography sx={{ fontSize: 12, mb: 0.5, color: clinicColors.muted }}>Ca {shifts[item.shift]?.toLowerCase()}</Typography><ScheduleCard schedule={item} onSelect={setSelectedSchedule} /></Box>) : <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>Chưa có ca làm việc</Typography>}</Stack>
                    </Box>)}
                </Stack>
            </>}
        </Paper>
        <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="sm" aria-labelledby="schedule-create-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
            <DialogTitle id="schedule-create-title" sx={clinicDialogTitleSx}>Thêm lịch trực mới</DialogTitle>
            <Box component="form" onSubmit={submit}><DialogContent sx={{ px: 3, pt: 1, pb: 3 }}><Stack spacing={2.5}>
                <Typography sx={{ color: clinicColors.muted, fontSize: 14, lineHeight: 1.65 }}>Chọn bác sĩ theo chuyên khoa và sắp xếp ca làm việc phù hợp với phòng khám.</Typography>
                {actionError && <Alert severity="error">{actionError}</Alert>}
                {doctorResult?.departmentId === departmentId && doctorResult?.error && <Alert severity="error" action={<Button onClick={refresh} color="inherit">Thử lại</Button>}>{doctorResult.error}</Alert>}
                <TextField select label="Chuyên khoa" size="small" value={specializationId} onChange={event => { setSpecializationId(String(event.target.value)); setForm(current => ({ ...current, doctorId: "" })); }} disabled={saving} sx={clinicFieldSx}>
                    <MenuItem value="">Chọn chuyên khoa</MenuItem>{specializations.map(item => <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>)}
                </TextField>
                <TextField required select label="Bác sĩ" value={form.doctorId} onChange={updateForm("doctorId")} disabled={saving || !departmentId} helperText={!departmentId ? "Chọn chuyên khoa trước để xem danh sách bác sĩ." : undefined} sx={clinicFieldSx}><MenuItem value="">Chọn bác sĩ</MenuItem>{doctors.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
                <TextField required select label="Phòng khám" value={form.roomId} onChange={updateForm("roomId")} disabled={saving} sx={clinicFieldSx}><MenuItem value="">Chọn phòng khám</MenuItem>{rooms.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField required type="date" label="Ngày làm việc" value={form.workDate} onChange={updateForm("workDate")} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} sx={clinicFieldSx} />
                    <TextField select label="Ca làm việc" value={form.shift} onChange={event => setForm(current => ({ ...current, shift: Number(event.target.value) }))} disabled={saving} sx={clinicFieldSx}>{shifts.map((shift, index) => <MenuItem key={shift} value={index}>{shift}</MenuItem>)}</TextField>
                    <TextField type="time" label="Giờ bắt đầu" value={form.startTime} onChange={updateForm("startTime")} disabled={saving} slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start"><ScheduleOutlined fontSize="small" /></InputAdornment> } }} sx={clinicFieldSx} />
                    <TextField type="time" label="Giờ kết thúc" value={form.endTime} onChange={updateForm("endTime")} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} sx={clinicFieldSx} />
                </Box>
                <TextField select label="Độ dài khung giờ" value={form.slotDurationMinutes} onChange={event => setForm(current => ({ ...current, slotDurationMinutes: Number(event.target.value) }))} disabled={saving} sx={clinicFieldSx}>{[15, 20, 30].map(value => <MenuItem key={value} value={value}>{value} phút</MenuItem>)}</TextField>
            </Stack></DialogContent><DialogActions sx={clinicDialogActionsSx}><Button disabled={saving} onClick={() => setOpen(false)} sx={clinicSecondaryButtonSx}>Hủy</Button><Button type="submit" variant="contained" disabled={saving || !departmentId} startIcon={<SaveOutlined />} sx={clinicPrimaryButtonSx}>{saving ? "Đang lưu..." : "Lưu lịch"}</Button></DialogActions></Box>
        </Dialog>
        <Dialog open={Boolean(selectedSchedule)} onClose={() => setSelectedSchedule(null)} fullWidth maxWidth="sm" aria-labelledby="schedule-detail-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
            <DialogTitle id="schedule-detail-title" sx={clinicDialogTitleSx}>Chi tiết ca làm việc</DialogTitle>
            {selectedSchedule && <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2}>
                <Box sx={{ bgcolor: "#F0F9FF", p: 2, borderRadius: 2 }}><Typography sx={{ fontWeight: 600 }}>{selectedSchedule.doctorName}</Typography><Typography sx={{ fontSize: 14, color: clinicColors.muted, mt: 0.5 }}>{selectedSchedule.roomName} · Ca {shifts[selectedSchedule.shift]?.toLowerCase()}</Typography><Typography sx={{ fontSize: 14, color: clinicColors.muted, mt: 0.5 }}>{formatDay(selectedSchedule.workDate)}</Typography></Box>
                <Typography sx={{ fontSize: 14, color: clinicColors.muted }}>{selectedSchedule.totalSlots} khung giờ · {selectedSchedule.bookedSlots} khung giờ đã đầy</Typography>
                <Table size="small" aria-label="Khung giờ của ca làm việc" sx={clinicTableSx}><TableHead><TableRow><TableCell>Khung giờ</TableCell><TableCell align="right">Đã đặt / sức chứa</TableCell></TableRow></TableHead><TableBody>{selectedSchedule.timeSlots?.map(slot => <TableRow key={slot.slotId}><TableCell>{slot.startTime} – {slot.endTime}</TableCell><TableCell align="right">{slot.currentBooked}/{slot.maxCapacity}</TableCell></TableRow>)}</TableBody></Table>
            </Stack></DialogContent>}
            <DialogActions sx={clinicDialogActionsSx}><Button onClick={() => setSelectedSchedule(null)} startIcon={<CloseOutlined />} sx={clinicSecondaryButtonSx}>Đóng</Button></DialogActions>
        </Dialog>
    </Stack>;
}
