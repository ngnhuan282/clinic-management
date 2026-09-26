import { FormEvent, useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Select, Skeleton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import catalogApi from "../../api/catalogApi";
import doctorScheduleApi from "../../api/doctorScheduleApi";

type Schedule = { scheduleId: string; doctorName: string; roomName: string; workDate: string; shift: number; totalSlots: number; bookedSlots: number };
type Option = { id: number; name: string; departmentId?: number };
type CatalogItem = { specializationId?: number; roomId?: number; name: string; departmentId?: number };
const shifts = ["Sáng", "Chiều", "Tối"];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export default function DoctorScheduleManagementPage() {
    const [weekStart, setWeekStart] = useState(dateKey(new Date()));
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [specializations, setSpecializations] = useState<Option[]>([]);
    const [doctors, setDoctors] = useState<Option[]>([]);
    const [rooms, setRooms] = useState<Option[]>([]);
    const [specializationId, setSpecializationId] = useState("");
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ doctorId: "", roomId: "", workDate: dateKey(new Date()), shift: 0, startTime: "08:00", endTime: "11:30", slotDurationMinutes: 30, maxCapacity: 1 });

    const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
        const date = new Date(`${weekStart}T00:00:00`);
        date.setDate(date.getDate() + index);
        return dateKey(date);
    }), [weekStart]);

    const loadSchedules = () => {
        setLoading(true);
        doctorScheduleApi.list({ weekStart, specializationId: specializationId || undefined })
            .then((response) => setSchedules(doctorScheduleApi.unwrap(response)))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        Promise.all([
            catalogApi.list("specializations", { pageNumber: 1, pageSize: 100, isActive: true }),
            catalogApi.list("rooms", { pageNumber: 1, pageSize: 100, isActive: true }),
        ]).then(([specializationResponse, roomResponse]) => {
            setSpecializations((doctorScheduleApi.unwrap(specializationResponse).items ?? []).map((x: CatalogItem) => ({ id: x.specializationId ?? 0, name: x.name, departmentId: x.departmentId })));
            setRooms((doctorScheduleApi.unwrap(roomResponse).items ?? []).map((x: CatalogItem) => ({ id: x.roomId ?? 0, name: x.name })));
        });
    }, []);
    useEffect(() => { loadSchedules(); }, [weekStart, specializationId]);
    useEffect(() => {
        const selected = specializations.find((x) => String(x.id) === specializationId);
        if (selected?.departmentId) {
            doctorScheduleApi.doctors(selected.departmentId).then((response) => {
                setDoctors((doctorScheduleApi.unwrap(response) ?? []).map((doctor: { doctorId: number; fullName: string }) => ({
                    id: doctor.doctorId,
                    name: doctor.fullName,
                })));
            });
        } else {
            setDoctors([]);
        }
    }, [specializationId, specializations]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        doctorScheduleApi.create(form).then(() => { setOpen(false); loadSchedules(); });
    };
    const scheduleFor = (day: string, shift: number) => schedules.find((x) => x.workDate === day && x.shift === shift);

    return <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#F6FAFE", minHeight: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
            <Box><Typography variant="h4">Lịch làm việc bác sĩ</Typography><Typography color="text.secondary">Quản lý ca trực và khung giờ khám</Typography></Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Thêm lịch trực</Button>
        </Box>
        <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Select size="small" displayEmpty value={specializationId} onChange={(e) => setSpecializationId(e.target.value)}><MenuItem value="">Tất cả chuyên khoa</MenuItem>{specializations.map((x) => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</Select>
            <TextField size="small" type="date" label="Tuần bắt đầu" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Paper>
        <Paper sx={{ overflow: "auto" }}><Box sx={{ minWidth: 900, display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)" }}>
            <Box sx={{ p: 1.5, fontWeight: 700 }}>Ca</Box>{days.map((day) => <Box key={day} sx={{ p: 1.5, fontWeight: 700, borderLeft: "1px solid #E5E9F0" }}>{new Date(`${day}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</Box>)}
            {shifts.map((shift, shiftIndex) => <><Box key={`label-${shift}`} sx={{ p: 1.5, fontWeight: 600, borderTop: "1px solid #E5E9F0" }}>{shift}</Box>{days.map((day) => { const item = scheduleFor(day, shiftIndex); return <Box key={`${day}-${shift}`} sx={{ p: 1, borderLeft: "1px solid #E5E9F0", borderTop: "1px solid #E5E9F0" }}>{loading ? <Skeleton variant="rounded" height={76} /> : item ? <Box sx={{ p: 1.25, backgroundColor: "#EFF6FF", border: "1px solid #90CAF9", borderRadius: 2 }}><Typography fontWeight={700} fontSize={13}>{item.doctorName}</Typography><Typography fontSize={12} color="text.secondary">{item.roomName}</Typography><Typography fontSize={12} color="primary">{item.bookedSlots}/{item.totalSlots} slots đã đầy</Typography></Box> : <Typography color="text.disabled" fontSize={12}>Trống</Typography>}</Box>; })}</>)}
        </Box></Paper>
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Thêm lịch trực mới</DialogTitle><Box component="form" onSubmit={submit}><DialogContent sx={{ display: "grid", gap: 2 }}>
            <Select required value={form.doctorId} displayEmpty onChange={(e) => setForm({ ...form, doctorId: e.target.value })}><MenuItem value="">Chọn bác sĩ</MenuItem>{doctors.map((x) => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</Select>
            <Select required value={form.roomId} displayEmpty onChange={(e) => setForm({ ...form, roomId: e.target.value })}><MenuItem value="">Chọn buồng khám</MenuItem>{rooms.map((x) => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</Select>
            <TextField required type="date" label="Ngày" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <Select value={form.shift} onChange={(e) => setForm({ ...form, shift: Number(e.target.value) })}>{shifts.map((x, i) => <MenuItem value={i} key={x}>{x}</MenuItem>)}</Select>
            <Box sx={{ display: "flex", gap: 2 }}><TextField fullWidth type="time" label="Bắt đầu" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} /><TextField fullWidth type="time" label="Kết thúc" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Box>
            <TextField select label="Độ dài khung giờ" value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: Number(e.target.value) })}>{[15, 20, 30].map((x) => <MenuItem key={x} value={x}>{x} phút</MenuItem>)}</TextField>
        </DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" variant="contained">Lưu lịch</Button></DialogActions></Box></Dialog>
    </Box>;
}
