import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import scheduleRequestApi from "../../api/scheduleRequestApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useAuth from "../../hooks/useAuth";

const statuses = ["Pending", "Approved", "Rejected", "Cancelled"];
const statusLabels = { Pending: "Chờ duyệt", Approved: "Đã duyệt", Rejected: "Từ chối", Cancelled: "Đã hủy" };
const timeText = value => typeof value === "string" ? value.slice(0, 5) : "";
const dateText = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "";

export default function ScheduleReviewPage() {
    const { role } = useAuth();
    const [status, setStatus] = useState("Pending");
    const [pageNumber, setPageNumber] = useState(1);
    const [list, setList] = useState({ items: [], totalItems: 0, totalPages: 0 });
    const [detail, setDetail] = useState(null);
    const [action, setAction] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setList(await scheduleRequestApi.list({ status, pageNumber, pageSize: 10 }));
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [status, pageNumber]);

    useEffect(() => {
        let active = true;
        scheduleRequestApi.list({ status, pageNumber, pageSize: 10 })
            .then(data => { if (active) setList(data); })
            .catch(err => { if (active) setError(getApiErrorMessage(err)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [status, pageNumber]);

    async function openDetail(id, nextAction = "") {
        setError("");
        setSuccess("");
        try {
            setDetail(await scheduleRequestApi.get(id));
            setAction(nextAction);
            setReason("");
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    async function submit() {
        if (action === "reject" && !reason.trim()) {
            setError("Vui lòng nhập lý do từ chối.");
            return;
        }
        setWorking(true);
        setError("");
        try {
            if (action === "approve") await scheduleRequestApi.approve(detail.requestId);
            else await scheduleRequestApi.reject(detail.requestId, reason.trim());
            setSuccess(action === "approve" ? "Đã duyệt ca khám." : "Đã từ chối yêu cầu.");
            setDetail(null);
            setAction("");
            await load();
        } catch (err) {
            if (err.response?.status === 409 || err.response?.status === 403) await load();
            setError(getApiErrorMessage(err));
        } finally {
            setWorking(false);
        }
    }

    return <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Paper sx={{ p: 3, mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}><FactCheckOutlinedIcon color="primary" /><Typography variant="h5" fontWeight={800}>Duyệt yêu cầu ca khám</Typography></Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
                {role === "Admin" ? "Yêu cầu đăng ký ca của Trưởng khoa chờ Admin xử lý." : "Yêu cầu đăng ký ca của bác sĩ thuộc khoa bạn phụ trách. Yêu cầu của chính bạn do Admin duyệt."}
            </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <TextField select size="small" label="Trạng thái" value={status} onChange={event => { setLoading(true); setStatus(event.target.value); setPageNumber(1); }} sx={{ minWidth: 180 }}>
                    {statuses.map(value => <MenuItem key={value} value={value}>{statusLabels[value]}</MenuItem>)}
                </TextField>
                <Button onClick={load}>Làm mới</Button>
                <Typography color="text.secondary">{list.totalItems} yêu cầu</Typography>
            </Stack>
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TableContainer component={Paper}>
            <Table>
                <TableHead><TableRow>
                    <TableCell>Mã</TableCell><TableCell>Bác sĩ</TableCell><TableCell>Khoa</TableCell><TableCell>Ngày khám</TableCell><TableCell>Khung giờ</TableCell><TableCell>Phòng</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell>
                </TableRow></TableHead>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        : list.items.length === 0 ? <TableRow><TableCell colSpan={8} align="center">Không có yêu cầu.</TableCell></TableRow>
                        : list.items.map(item => <TableRow key={item.requestId} hover>
                            <TableCell>#{item.requestId}</TableCell><TableCell>{item.doctorName}</TableCell><TableCell>{item.departmentName}</TableCell>
                            <TableCell>{dateText(item.workDate)}</TableCell><TableCell>{timeText(item.startTime)}–{timeText(item.endTime)}</TableCell><TableCell>{item.roomName}</TableCell>
                            <TableCell><Chip size="small" label={statusLabels[item.status] || item.status} color={item.status === "Approved" ? "success" : item.status === "Rejected" ? "error" : "warning"} /></TableCell>
                            <TableCell align="right"><Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Button size="small" onClick={() => openDetail(item.requestId)}>Chi tiết</Button>
                                {item.canReview && <><Button size="small" variant="contained" onClick={() => openDetail(item.requestId, "approve")}>Duyệt</Button><Button size="small" color="error" onClick={() => openDetail(item.requestId, "reject")}>Từ chối</Button></>}
                            </Stack></TableCell>
                        </TableRow>)}
                </TableBody>
            </Table>
        </TableContainer>
        <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
            <Button disabled={pageNumber <= 1} onClick={() => { setLoading(true); setPageNumber(value => value - 1); }}>Trước</Button>
            <Typography>{pageNumber}/{Math.max(1, list.totalPages)}</Typography>
            <Button disabled={pageNumber >= list.totalPages} onClick={() => { setLoading(true); setPageNumber(value => value + 1); }}>Sau</Button>
        </Stack>
        <Dialog open={Boolean(detail)} onClose={() => !working && setDetail(null)} fullWidth maxWidth="sm">
            <DialogTitle>Yêu cầu ca khám #{detail?.requestId}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {detail && <Stack spacing={1.5} sx={{ pt: 1 }}>
                    <Typography><strong>Bác sĩ:</strong> {detail.doctorName}</Typography>
                    <Typography><strong>Khoa:</strong> {detail.departmentName}</Typography>
                    <Typography><strong>Ngày và giờ:</strong> {dateText(detail.workDate)}, {timeText(detail.startTime)}–{timeText(detail.endTime)}</Typography>
                    <Typography><strong>Phòng:</strong> {detail.roomName}</Typography>
                    <Typography><strong>Trạng thái:</strong> {statusLabels[detail.status] || detail.status}</Typography>
                    {detail.rejectReason && <Typography><strong>Lý do từ chối:</strong> {detail.rejectReason}</Typography>}
                    {action === "reject" && <TextField multiline minRows={3} label="Lý do từ chối" required inputProps={{ maxLength: 200 }} value={reason} onChange={event => setReason(event.target.value)} />}
                </Stack>}
            </DialogContent>
            <DialogActions><Button onClick={() => { setDetail(null); setAction(""); }} disabled={working}>Đóng</Button>
                {action && detail?.canReview && <Button color={action === "reject" ? "error" : "primary"} variant="contained" disabled={working || (action === "reject" && !reason.trim())} onClick={submit}>{action === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}</Button>}
            </DialogActions>
        </Dialog>
    </Box>;
}
