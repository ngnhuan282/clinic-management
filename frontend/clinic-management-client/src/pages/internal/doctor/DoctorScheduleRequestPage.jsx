import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { EditCalendarRounded, SendRounded } from "@mui/icons-material";
import doctorScheduleApi from "../../../api/doctorScheduleApi";
import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import { clinicColors, clinicFieldSx, clinicPrimaryButtonSx, clinicSurfaceSx, clinicTableSx } from "../../../components/common/clinicUi";
import useNotifications from "../../../hooks/useNotifications";
import useAuth from "../../../hooks/useAuth";

const statusStyle = {
    Pending: { label: "Chờ duyệt", bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
    Approved: { label: "Đã duyệt", bg: "#DCFCE7", color: "#065F46", border: "#86EFAC" },
    Rejected: { label: "Từ chối", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
};

const displayDate = value => String(value).slice(0, 10).split("-").reverse().join("/");

export default function DoctorScheduleRequestPage() {
    const { userId, sessionRevision } = useAuth();
    return <ScheduleRequestForm key={`${userId}:${sessionRevision}`} />;
}

function ScheduleRequestForm() {
    const { revision } = useNotifications();
    const [rooms, setRooms] = useState([]);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ roomId: "", workDate: "", startTime: "08:00", endTime: "11:30" });
    useEffect(() => {
        const controller = new AbortController();
        Promise.all([doctorScheduleApi.rooms(controller.signal), doctorScheduleApi.myRequests(controller.signal)])
            .then(([roomResponse, requestResponse]) => {
                if (controller.signal.aborted) return;
                setRooms((doctorScheduleApi.unwrap(roomResponse) ?? []).map(x => ({ id: x.roomId, roomNumber: x.roomNumber, name: x.name, departmentName: x.departmentName })));
                setRequests(doctorScheduleApi.unwrap(requestResponse));
                setError("");
            }).catch(e => {
                if (controller.signal.aborted) return;
                setRooms([]); setRequests([]);
                setError(e.response?.data?.message || "Không thể tải dữ liệu đăng ký ca.");
            });
        return () => controller.abort();
    }, [revision, reload]);
    const submit = (event) => {
        event.preventDefault();
        if (sending) return;
        setSending(true);
        setError("");
        doctorScheduleApi.submitRequest(form).then(() => { setForm({ ...form, roomId: "" }); setReload(value => value + 1); })
            .catch(e => setError(e.response?.data?.message || "Gửi yêu cầu thất bại."))
            .finally(() => setSending(false));
    };
    const change = name => event => setForm({ ...form, [name]: event.target.value });
    const labelShrink = { inputLabel: { shrink: true } };

    return <Stack spacing={3} sx={{ p: { xs: 2, md: 4 }, pb: 5, minWidth: 0 }}>
        <ClinicPageHeader
            icon={EditCalendarRounded}
            eyebrow="Khám bệnh & lâm sàng"
            title="Đăng ký lịch làm việc"
            description="Gửi ca trực để trưởng khoa phê duyệt trước khi mở lịch cho bệnh nhân. Ca của trưởng khoa do quản trị viên duyệt."
        />

        {error && <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>}

        <Paper component="form" onSubmit={submit} variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.25, md: 3 } }}>
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 750, color: clinicColors.heading }}>Đăng ký ca làm việc mới</Typography>
            <Typography sx={{ mt: 0.4, mb: 2.25, fontSize: 13.5, color: clinicColors.muted }}>Chọn ngày, phòng khám và khung giờ bạn muốn nhận ca.</Typography>
            <Box sx={{ display: "grid", gap: 2, alignItems: "start", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1.8fr 0.8fr 0.8fr auto" } }}>
                <TextField required size="small" type="date" label="Ngày làm việc" value={form.workDate} onChange={change("workDate")} slotProps={labelShrink} sx={clinicFieldSx} />
                <TextField required select size="small" label="Phòng khám" value={form.roomId} onChange={change("roomId")} sx={clinicFieldSx}>
                    {rooms.length === 0 && <MenuItem value="" disabled>Chưa có phòng khám khả dụng</MenuItem>}
                    {rooms.map((room) => <MenuItem key={room.id} value={room.id}>{room.roomNumber} - {room.name}{room.departmentName ? ` (${room.departmentName})` : ""}</MenuItem>)}
                </TextField>
                <TextField required size="small" type="time" label="Giờ bắt đầu" value={form.startTime} onChange={change("startTime")} slotProps={labelShrink} sx={clinicFieldSx} />
                <TextField required size="small" type="time" label="Giờ kết thúc" value={form.endTime} onChange={change("endTime")} slotProps={labelShrink} sx={clinicFieldSx} />
                <Button type="submit" variant="contained" disabled={sending} startIcon={<SendRounded />} sx={{ ...clinicPrimaryButtonSx, height: 40, whiteSpace: "nowrap", width: { xs: "100%", lg: "auto" } }}>
                    {sending ? "Đang gửi…" : "Gửi yêu cầu"}
                </Button>
            </Box>
        </Paper>

        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
            <Stack direction="row" sx={{ px: 2.5, py: 2, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4ECF5" }}>
                <Typography component="h2" sx={{ fontSize: 15, fontWeight: 750, color: clinicColors.heading }}>Yêu cầu đã gửi ({requests.length})</Typography>
            </Stack>
            {requests.length === 0
                ? <Box sx={{ p: 3 }}><Alert severity="info" sx={{ borderRadius: "10px" }}>Bạn chưa gửi yêu cầu đăng ký ca làm việc nào.</Alert></Box>
                : <TableContainer sx={{ overflowX: "auto" }}>
                    <Table aria-label="Yêu cầu đăng ký ca làm việc" sx={{ ...clinicTableSx, minWidth: 720 }}>
                        <TableHead><TableRow><TableCell>Ngày</TableCell><TableCell>Thời gian</TableCell><TableCell>Phòng</TableCell><TableCell>Trạng thái</TableCell><TableCell>Lý do từ chối</TableCell></TableRow></TableHead>
                        <TableBody>
                            {requests.map((item) => {
                                const status = statusStyle[item.status] || statusStyle.Pending;
                                return <TableRow key={item.requestId} hover>
                                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 650, color: clinicColors.heading }}>{displayDate(item.workDate)}</TableCell>
                                    <TableCell sx={{ whiteSpace: "nowrap" }}>{String(item.startTime).slice(0, 5)} - {String(item.endTime).slice(0, 5)}</TableCell>
                                    <TableCell>{item.roomName}</TableCell>
                                    <TableCell><Chip size="small" label={status.label} sx={{ bgcolor: status.bg, color: status.color, border: `1px solid ${status.border}`, fontWeight: 650 }} /></TableCell>
                                    <TableCell sx={{ color: item.rejectReason ? "inherit" : "#94A3B8" }}>{item.rejectReason || "—"}</TableCell>
                                </TableRow>;
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>}
        </Paper>
    </Stack>;
}
