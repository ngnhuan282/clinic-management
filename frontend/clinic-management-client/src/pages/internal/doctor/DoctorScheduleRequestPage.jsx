import { useEffect, useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import doctorScheduleApi from "../../../api/doctorScheduleApi";
import useNotifications from "../../../hooks/useNotifications";

const statusStyle = { Pending: { label: "Chờ duyệt", color: "warning.main" }, Approved: { label: "Đã duyệt", color: "success.main" }, Rejected: { label: "Từ chối", color: "error.main" } };

export default function DoctorScheduleRequestPage() {
    const { revision } = useNotifications();
    const [rooms, setRooms] = useState([]);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ roomId: "", workDate: "", startTime: "08:00", endTime: "11:30" });
    const load = () => doctorScheduleApi.myRequests().then((r) => setRequests(doctorScheduleApi.unwrap(r))).catch((e) => setError(e.response?.data?.message || "Không thể tải yêu cầu."));
    useEffect(() => {
        doctorScheduleApi.rooms().then((r) => setRooms((doctorScheduleApi.unwrap(r) ?? []).map((x) => ({ id: x.roomId, roomNumber: x.roomNumber, name: x.name, departmentName: x.departmentName })))).catch(() => setError("Không thể tải danh sách phòng."));
        load();
    }, [revision]);
    const submit = (event) => {
        event.preventDefault();
        setError("");
        doctorScheduleApi.submitRequest(form).then(() => { setForm({ ...form, roomId: "" }); load(); }).catch((e) => setError(e.response?.data?.message || "Gửi yêu cầu thất bại."));
    };
    return <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#F6FAFE", minHeight: "100%" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Đăng ký lịch làm việc</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Gửi ca trực để quản trị viên phê duyệt trước khi mở lịch cho bệnh nhân.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper component="form" onSubmit={submit} sx={{ p: 2, mb: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField required type="date" label="Ngày" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                <Select required displayEmpty value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}><MenuItem value="">Chọn phòng</MenuItem>{rooms.map((room) => <MenuItem key={room.id} value={room.id}>{room.roomNumber} - {room.name}{room.departmentName ? ` (${room.departmentName})` : ""}</MenuItem>)}</Select>
                <TextField required type="time" label="Bắt đầu" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField required type="time" label="Kết thúc" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                <Button type="submit" variant="contained">Gửi yêu cầu</Button>
            </Stack>
        </Paper>
        <Paper><Table><TableHead><TableRow><TableCell>Ngày</TableCell><TableCell>Thời gian</TableCell><TableCell>Phòng</TableCell><TableCell>Trạng thái</TableCell><TableCell>Lý do từ chối</TableCell></TableRow></TableHead><TableBody>
            {requests.map((item) => { const status = statusStyle[item.status] || statusStyle.Pending; return <TableRow key={item.requestId}><TableCell>{item.workDate}</TableCell><TableCell>{String(item.startTime).slice(0, 5)} - {String(item.endTime).slice(0, 5)}</TableCell><TableCell>{item.roomName}</TableCell><TableCell sx={{ color: status.color, fontWeight: 700 }}>{status.label}</TableCell><TableCell>{item.rejectReason || "—"}</TableCell></TableRow>; })}
        </TableBody></Table></Paper>
    </Box>;
}
