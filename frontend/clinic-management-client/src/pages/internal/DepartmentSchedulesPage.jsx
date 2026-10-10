import { useState } from "react";
import { Alert, Box, Button, Chip, LinearProgress, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import useAuth from "../../hooks/useAuth";
import useDepartmentSchedules from "../../hooks/useDepartmentSchedules";
import DepartmentScheduleGrid from "../../components/internal/DepartmentScheduleGrid";
import { addDays, clinicToday, formatDay, mondayOf, shortTime } from "../../utils/scheduleCalendar";

export default function DepartmentSchedulesPage() {
    const { user } = useAuth();
    const [mode, setMode] = useState("week");
    const [date, setDate] = useState(clinicToday);
    const [doctorId, setDoctorId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const { items, options, loading, error, refresh } = useDepartmentSchedules({ mode, date, doctorId, roomId });
    const start = mode === "week" ? mondayOf(date) : date;
    const visible = items.filter(item => `${item.doctorName} ${item.roomName}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
    const selected = visible.find(item => item.scheduleId === selectedId) || visible[0];
    return <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F6FAFE", minHeight: "100%" }}>
        <Paper sx={{ p: 2.5, mb: 2 }}>
            <Stack direction="row" sx={{ gap: 2, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h5" fontWeight={800}>Lịch làm việc của khoa{options ? ` — ${options.departmentName}` : ""}</Typography>
                <Chip label="Ca đã duyệt" color="success" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Phụ trách: {user?.fullName} • Dữ liệu giới hạn theo khoa của Trưởng khoa</Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
                <ToggleButtonGroup exclusive value={mode} onChange={(_, value) => { if (value) setMode(value); }} size="small" color="primary" aria-label="Chế độ lịch" sx={{ flexShrink: 0 }}>
                    <ToggleButton value="week">Xem theo tuần</ToggleButton><ToggleButton value="day">Xem theo ngày</ToggleButton>
                </ToggleButtonGroup>
                <Button sx={{ minWidth: 32 }} aria-label={mode === "week" ? "Tuần trước" : "Ngày trước"} onClick={() => setDate(addDays(date, mode === "week" ? -7 : -1))}><ChevronLeftIcon /></Button>
                <TextField sx={{ width: 160, flexShrink: 0 }} type="date" size="small" label="Chọn ngày" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} slotProps={{ inputLabel: { shrink: true } }} />
                <Button sx={{ minWidth: 32 }} aria-label={mode === "week" ? "Tuần sau" : "Ngày sau"} onClick={() => setDate(addDays(date, mode === "week" ? 7 : 1))}><ChevronRightIcon /></Button>
                <Button variant="contained" onClick={() => setDate(clinicToday())}>Hôm nay</Button>
                <Button onClick={refresh} disabled={loading}>Tải lại</Button>
                <Typography fontSize={13} color="text.secondary">{visible.length} ca • {new Set(visible.map(item => item.doctorId)).size} bác sĩ • {new Set(visible.map(item => item.roomId)).size} phòng</Typography>
            </Stack>
            <Typography fontSize={13} color="primary" sx={{ mb: 2 }}>{formatDay(start)}{mode === "week" ? ` — ${formatDay(addDays(start, 6))}` : ""}</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField select size="small" fullWidth label="Lọc theo bác sĩ" value={doctorId} onChange={event => setDoctorId(event.target.value)}>
                    <MenuItem value="">Tất cả bác sĩ trong khoa</MenuItem>{options?.doctors.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                </TextField>
                <TextField select size="small" fullWidth label="Lọc theo phòng khám" value={roomId} onChange={event => setRoomId(event.target.value)}>
                    <MenuItem value="">Tất cả phòng trong khoa</MenuItem>{options?.rooms.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                </TextField>
                <TextField size="small" fullWidth label="Tìm bác sĩ, phòng" value={search} onChange={event => setSearch(event.target.value)} />
            </Stack>
        </Paper>
        {loading ? <Paper sx={{ p: 3 }}><Typography>Đang tải lịch khoa…</Typography><LinearProgress sx={{ mt: 2 }} /></Paper>
            : error ? <Alert severity="error" action={<Button onClick={refresh}>Thử lại</Button>}>{error}</Alert>
            : !visible.length ? <Paper sx={{ p: 5, textAlign: "center" }}><Typography>Không có ca đã duyệt trong khoảng thời gian và bộ lọc đã chọn.</Typography></Paper>
            : <><DepartmentScheduleGrid mode={mode} start={start} items={visible} rooms={options?.rooms || []} selectedId={selected?.scheduleId} onSelect={setSelectedId} />
                {selected && <Paper sx={{ p: 2.5, mt: 2 }} aria-label="Chi tiết ca khám đã duyệt">
                    <Stack direction="row" sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}><Typography variant="h6">Chi tiết ca khám đã duyệt</Typography><Chip color="success" variant="outlined" label="Đã phê duyệt" /></Stack>
                    <Typography variant="caption" color="text.secondary">{selected.scheduleId}</Typography>
                    <Box sx={{ bgcolor: "#EFF4FA", p: 2, my: 2, borderRadius: 1 }}><Typography fontWeight={700}>{selected.doctorName}</Typography></Box>
                    {[ ["Ngày làm việc", formatDay(selected.workDate)], ["Khung giờ trực", `${shortTime(selected.startTime)} – ${shortTime(selected.endTime)}`],
                        ["Phòng khám chỉ định", selected.roomName], ["Phê duyệt bởi", selected.reviewerName || "Lịch đã công bố"],
                        ["Lượt khám đã đặt", `${selected.bookedPatients} / ${selected.maxPatients}`] ].map(([label, value]) => <Stack key={label} direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1, py: 1.5, borderBottom: "1px solid #E5E9F0" }}><Typography color="text.secondary" fontSize={13}>{label}</Typography><Typography fontSize={13} fontWeight={600} sx={{ textAlign: { xs: "left", sm: "right" } }}>{value}</Typography></Stack>)}
                    <Alert severity="info" sx={{ mt: 2 }}>Màn hình phục vụ tra cứu lịch khoa đã duyệt. Để điều chỉnh ca, hãy liên hệ người phụ trách duyệt lịch.</Alert>
                </Paper>}
            </>}
    </Box>;
}
