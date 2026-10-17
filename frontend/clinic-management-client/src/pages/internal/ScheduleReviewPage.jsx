import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, MenuItem, Pagination, Paper, Skeleton, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { CheckCircleOutlineOutlined, CancelOutlined, FactCheckOutlined, FilterListOutlined, RefreshOutlined, RestartAltOutlined, SearchOutlined, VisibilityOutlined, WarningAmberOutlined } from "@mui/icons-material";
import scheduleRequestApi from "../../api/scheduleRequestApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useAuth from "../../hooks/useAuth";
import useNotifications from "../../hooks/useNotifications";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import { clinicButtonSx, clinicColors, clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx, clinicSurfaceSx, clinicTableSx } from "../../components/common/clinicUi";

const statusConfig = {
    Pending: { label: "Chờ duyệt", bg: "#FFFBEB", color: "#92400E" },
    Approved: { label: "Đã duyệt", bg: "#ECFDF5", color: "#047857" },
    Rejected: { label: "Từ chối", bg: "#FEF2F2", color: "#B91C1C" },
    Cancelled: { label: "Đã hủy", bg: "#F1F5F9", color: "#64748B" },
};
const timeText = value => typeof value === "string" ? value.slice(0, 5) : "–";
const dateText = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "–";
const pageSize = 10;

function StatusBadge({ status }) {
    const config = statusConfig[status] || { label: status, bg: "#F1F5F9", color: "#64748B" };
    return <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 500 }} />;
}

function RequestSummary({ item }) {
    return <Stack spacing={1.5}>
        {[["Bác sĩ", item.doctorName], ["Khoa", item.departmentName], ["Ngày làm việc", dateText(item.workDate)], ["Khung giờ", `${timeText(item.startTime)} – ${timeText(item.endTime)}`], ["Phòng khám", item.roomName]].map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" }, gap: 0.5 }}><Typography sx={{ fontSize: 14, color: clinicColors.muted }}>{label}</Typography><Typography sx={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere" }}>{value || "–"}</Typography></Box>)}
    </Stack>;
}

function ActionDialog({ target, working, error, onClose, onConfirm }) {
    const [reason, setReason] = useState("");
    const isReject = target.action === "reject";
    return <Dialog open onClose={working ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="request-action-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
        <DialogTitle id="request-action-title" sx={clinicDialogTitleSx}>{isReject ? "Từ chối yêu cầu ca khám" : "Phê duyệt yêu cầu ca khám"}</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2, bgcolor: "#F8FAFC" }}><RequestSummary item={target.item} /></Paper>
            {isReject ? <TextField multiline minRows={3} fullWidth label="Lý do từ chối" value={reason} onChange={event => setReason(event.target.value)} helperText={`${reason.length}/200 ký tự`} disabled={working} slotProps={{ htmlInput: { maxLength: 200 } }} sx={clinicFieldSx} /> : <Typography sx={{ fontSize: 14, color: clinicColors.muted, lineHeight: 1.7 }}>Sau khi duyệt, hệ thống tạo lịch làm việc và các khung giờ đặt khám cho ca này.</Typography>}
        </Stack></DialogContent>
        <DialogActions sx={clinicDialogActionsSx}><Button disabled={working} onClick={onClose} sx={clinicSecondaryButtonSx}>Hủy</Button><Button disabled={working || (isReject && !reason.trim())} variant="contained" color={isReject ? "error" : "primary"} onClick={() => onConfirm(reason.trim())} startIcon={isReject ? <CancelOutlined /> : <CheckCircleOutlineOutlined />} sx={isReject ? clinicButtonSx : clinicPrimaryButtonSx}>{working ? "Đang xử lý..." : isReject ? "Xác nhận từ chối" : "Xác nhận phê duyệt"}</Button></DialogActions>
    </Dialog>;
}

export default function ScheduleReviewPage() {
    const { revision } = useNotifications();
    const { role, user } = useAuth();
    const isAdmin = role === "Admin";
    const tabs = ["Pending", "Approved", "Rejected", ...(!isAdmin ? ["Cancelled"] : []), "All"];
    const [activeTab, setActiveTab] = useState("Pending");
    const [tabCounts, setTabCounts] = useState({});
    const [search, setSearch] = useState("");
    const [workDate, setWorkDate] = useState("");
    const [roomFilter, setRoomFilter] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [listResult, setListResult] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [manualRevision, setManualRevision] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [detail, setDetail] = useState(null);
    const [target, setTarget] = useState(null);
    const [working, setWorking] = useState(false);
    const [actionError, setActionError] = useState("");
    const listRequest = useRef(0);
    const apiStatus = activeTab === "All" ? undefined : activeTab;
    const queryKey = JSON.stringify([apiStatus, pageNumber]);
    const currentResult = listResult?.key === queryKey ? listResult : null;
    const loading = refreshing || !currentResult;
    const list = currentResult?.data || { items: [], totalItems: 0, totalPages: 0 };

    const load = useCallback((isActive = () => true) => {
        const requestId = ++listRequest.current;
        const isCurrent = () => isActive() && requestId === listRequest.current;
        const params = { pageNumber, pageSize };
        if (apiStatus) params.status = apiStatus;
        return scheduleRequestApi.list(params).then(data => {
            if (!isCurrent()) return;
            setListResult({ key: queryKey, data });
            setError("");
            if (pageNumber > Math.max(1, data.totalPages)) setPageNumber(Math.max(1, data.totalPages));
        }).catch(requestError => {
            if (isCurrent()) {
                setListResult({ key: queryKey, data: { items: [], totalItems: 0, totalPages: 0 } });
                setError(getApiErrorMessage(requestError));
            }
        }).finally(() => { if (isCurrent()) setRefreshing(false); });
    }, [apiStatus, pageNumber, queryKey]);

    useEffect(() => {
        let active = true;
        void load(() => active);
        return () => { active = false; };
    }, [load, revision]);
    useEffect(() => {
        let active = true;
        Promise.all(["Pending", "Approved", "Rejected", "Cancelled"].map(async status => {
            try {
                const data = await scheduleRequestApi.list({ status, pageNumber: 1, pageSize: 1 });
                return [status, data.totalItems];
            } catch { return [status, undefined]; }
        })).then(counts => { if (active) setTabCounts(Object.fromEntries(counts)); });
        return () => { active = false; };
    }, [success, revision, manualRevision]);

    const refresh = () => { setRefreshing(true); setManualRevision(value => value + 1); void load(); };
    const reset = () => { setSearch(""); setWorkDate(""); setRoomFilter(""); };
    const filtered = list.items.filter(item => {
        const query = search.trim().toLocaleLowerCase("vi");
        return (!query || `${item.requestId} ${item.doctorName} ${item.roomName}`.toLocaleLowerCase("vi").includes(query))
            && (!workDate || item.workDate === workDate) && (!roomFilter || item.roomName === roomFilter);
    });
    const rooms = [...new Set([roomFilter, ...list.items.map(item => item.roomName)].filter(Boolean))];
    const openAction = (item, action) => { setActionError(""); setTarget({ item, action }); };
    const confirm = async reason => {
        if (working || !target?.item.canReview) return;
        setWorking(true); setActionError("");
        try {
            if (target.action === "approve") await scheduleRequestApi.approve(target.item.requestId);
            else await scheduleRequestApi.reject(target.item.requestId, reason);
            setSuccess(`Đã ${target.action === "approve" ? "phê duyệt" : "từ chối"} yêu cầu #${target.item.requestId}.`);
            setTarget(null);
            await load();
        } catch (requestError) {
            if ([409, 403].includes(requestError.response?.status)) void load();
            setActionError(getApiErrorMessage(requestError));
        } finally { setWorking(false); }
    };

    return <Stack spacing={2.5} sx={{ pb: 4, minWidth: 0 }}>
        <ClinicPageHeader title="Duyệt yêu cầu ca khám" icon={FactCheckOutlined} description={isAdmin ? "Xem và xử lý các yêu cầu ca làm việc theo quyền phê duyệt của bạn." : `Các yêu cầu ca làm việc trong khoa phụ trách${user?.departmentName ? ": " + user.departmentName : "."}`} />
        <Alert severity="info" sx={{ borderRadius: 2, bgcolor: "#F0F9FF", color: "#075985" }}>Bạn không được tự duyệt yêu cầu của mình. {isAdmin ? "Các thao tác duyệt hiển thị theo quyền xử lý của từng yêu cầu." : "Chỉ hiển thị yêu cầu của bác sĩ và phòng khám thuộc khoa phụ trách."}</Alert>
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}
        {error && <Alert severity="error" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{error}</Alert>}
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}><FilterListOutlined sx={{ fontSize: 18, color: clinicColors.muted }} /><Typography sx={{ fontSize: 14, fontWeight: 600 }}>Bộ lọc yêu cầu</Typography></Stack>
            <Typography sx={{ mb: 2, fontSize: 13, color: clinicColors.muted }}>Trạng thái và phân trang áp dụng cho toàn bộ danh sách. Các bộ lọc bên dưới áp dụng trên trang đang xem.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr 1fr" }, gap: 1.5 }}>
                <TextField fullWidth size="small" label="Tìm trong trang hiện tại" placeholder="Tên bác sĩ, mã yêu cầu hoặc phòng" value={search} onChange={event => setSearch(event.target.value)} sx={clinicFieldSx} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ color: "#94A3B8", fontSize: 20 }} /></InputAdornment> } }} />
                <TextField fullWidth size="small" type="date" label="Ngày làm việc" value={workDate} onChange={event => setWorkDate(event.target.value)} sx={clinicFieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField fullWidth size="small" select label="Phòng khám trong trang" value={roomFilter} onChange={event => setRoomFilter(event.target.value)} sx={clinicFieldSx}><MenuItem value="">Tất cả phòng khám</MenuItem>{rooms.map(room => <MenuItem key={room} value={room}>{room}</MenuItem>)}</TextField>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
                <Button onClick={reset} startIcon={<RestartAltOutlined />} sx={clinicButtonSx}>Đặt lại bộ lọc</Button>
                <Button variant="outlined" disabled={loading} onClick={refresh} startIcon={<RefreshOutlined />} sx={clinicSecondaryButtonSx}>Làm mới dữ liệu</Button>
            </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
            <Tabs value={activeTab} onChange={(_, value) => { setActiveTab(value); setPageNumber(1); reset(); setSuccess(""); }} variant="scrollable" scrollButtons="auto" aria-label="Trạng thái yêu cầu ca" sx={{ px: 1.5, borderBottom: "1px solid #E2E8F0", "& .MuiTab-root": { textTransform: "none", fontSize: 14, fontWeight: 600, minHeight: 56 } }}>
                {tabs.map(status => <Tab key={status} value={status} label={<Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><span>{status === "All" ? "Tất cả trạng thái" : statusConfig[status].label}</span>{tabCounts[status] !== undefined && <Chip size="small" label={tabCounts[status]} sx={{ height: 22, bgcolor: "#F1F5F9", color: clinicColors.muted }} />}</Stack>} />)}
            </Tabs>
            {loading && <LinearProgress />}
            <Typography sx={{ px: 2.5, pt: 1.5, display: { xs: "block", md: "none" }, fontSize: 12, color: clinicColors.muted }}>Vuốt ngang bảng để xem trạng thái và thao tác.</Typography>
            <TableContainer><Table aria-label="Các yêu cầu ca khám" sx={{ ...clinicTableSx, minWidth: 1060 }}><TableHead><TableRow><TableCell>Yêu cầu</TableCell><TableCell>Bác sĩ / khoa</TableCell><TableCell>Ca làm việc</TableCell><TableCell>Phòng khám</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead><TableBody>
                {loading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>) : filtered.length ? filtered.map(item => <TableRow key={item.requestId} hover>
                    <TableCell sx={{ color: "#0284C7", fontWeight: 600 }}>#{item.requestId}</TableCell>
                    <TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}><Avatar sx={{ width: 34, height: 34, bgcolor: "#E0F2FE", color: "#0369A1", fontSize: 13 }}>{item.doctorName?.trim().split(" ").pop()?.slice(0, 2).toUpperCase()}</Avatar><Box><Typography sx={{ fontSize: 14, fontWeight: 600 }}>{item.doctorName}</Typography><Typography sx={{ fontSize: 13, color: clinicColors.muted, mt: 0.5 }}>{item.departmentName}</Typography></Box></Stack></TableCell>
                    <TableCell><Typography sx={{ fontSize: 14, fontWeight: 500 }}>{dateText(item.workDate)}</Typography><Typography sx={{ fontSize: 13, color: clinicColors.muted, mt: 0.5 }}>{timeText(item.startTime)} – {timeText(item.endTime)}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: 14 }}>{item.roomName || "–"}</Typography>{item.isConflict && <Tooltip title={item.conflictDetails || "Có xung đột lịch"}><Chip icon={<WarningAmberOutlined />} size="small" label="Trùng lịch" sx={{ mt: 0.75, bgcolor: "#FFFBEB", color: "#92400E" }} /></Tooltip>}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell align="right"><Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                        {item.canReview && <><Button size="small" variant="contained" onClick={() => openAction(item, "approve")} startIcon={<CheckCircleOutlineOutlined />} sx={{ ...clinicPrimaryButtonSx, minHeight: 34, whiteSpace: "nowrap" }}>Duyệt</Button><Button size="small" variant="outlined" color="error" onClick={() => openAction(item, "reject")} startIcon={<CancelOutlined />} sx={{ ...clinicButtonSx, minHeight: 34, whiteSpace: "nowrap" }}>Từ chối</Button></>}
                        {!item.canReview && item.status === "Pending" && <Typography sx={{ fontSize: 12, color: clinicColors.muted }}>Không có quyền duyệt</Typography>}
                        <Tooltip title="Xem chi tiết"><IconButton size="small" aria-label={`Xem chi tiết yêu cầu #${item.requestId}`} onClick={() => setDetail(item)} sx={{ color: "#64748B" }}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>
                    </Stack></TableCell>
                </TableRow>) : <TableRow><TableCell colSpan={6}><EmptyState message="Không có yêu cầu phù hợp trên trang này." /></TableCell></TableRow>}
            </TableBody></Table></TableContainer>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ p: 2.5, justifyContent: "space-between", alignItems: { md: "center" }, borderTop: "1px solid #E2E8F0" }}>
                <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>{filtered.length}/{list.items.length} yêu cầu trên trang · {list.totalItems} yêu cầu theo trạng thái</Typography>
                <Pagination count={Math.max(1, list.totalPages)} page={pageNumber} disabled={loading} onChange={(_, value) => setPageNumber(value)} shape="rounded" color="primary" size="small" getItemAriaLabel={(type, value) => type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`} />
            </Stack>
        </Paper>
        {target && <ActionDialog key={`${target.action}-${target.item.requestId}`} target={target} working={working} error={actionError} onClose={() => setTarget(null)} onConfirm={confirm} />}
        <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm" aria-labelledby="request-detail-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
            <DialogTitle id="request-detail-title" sx={clinicDialogTitleSx}>Chi tiết yêu cầu #{detail?.requestId}</DialogTitle>
            {detail && <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2.5}><RequestSummary item={detail} /><StatusBadge status={detail.status} />{detail.rejectReason && <Alert severity="warning" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Lý do từ chối: {detail.rejectReason}</Alert>}{detail.isConflict && <Alert severity="warning">{detail.conflictDetails}</Alert>}</Stack></DialogContent>}
            <DialogActions sx={clinicDialogActionsSx}><Button onClick={() => setDetail(null)} sx={clinicSecondaryButtonSx}>Đóng</Button></DialogActions>
        </Dialog>
    </Stack>;
}
