import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import scheduleRequestApi from "../../api/scheduleRequestApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import useAuth from "../../hooks/useAuth";

// ── helpers ──────────────────────────────────────────────────────────────────
const timeText = (v) => (typeof v === "string" ? v.slice(0, 5) : "–");
const dateText = (v) =>
    v ? new Date(`${v}T00:00:00`).toLocaleDateString("vi-VN") : "–";
const dayOfWeek = (v) => {
    if (!v) return "";
    const d = new Date(`${v}T00:00:00`).getDay();
    return ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"][d] || "";
};
const durationHours = (start, end) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return null;
    return (mins / 60).toFixed(1).replace(/\.0$/, "");
};

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    Pending:  { label: "Chờ duyệt",  bgColor: "#FEF3C7", textColor: "#92400E" },
    Approved: { label: "Đã duyệt",   bgColor: "#D1FAE5", textColor: "#065F46" },
    Rejected: { label: "Từ chối",    bgColor: "#FEE2E2", textColor: "#991B1B" },
    Cancelled:{ label: "Đã hủy",     bgColor: "#F3F4F6", textColor: "#374151" },
};

const HEAD_TABS = [
    { value: "Pending",   label: "Chờ duyệt" },
    { value: "Approved",  label: "Đã duyệt" },
    { value: "Rejected",  label: "Đã từ chối" },
    { value: "Cancelled", label: "Đã hủy" },
    { value: "Mine",      label: "Yêu cầu cá nhân của tôi" },
];
const ADMIN_TABS = [
    { value: "Pending",   label: "Chờ Admin duyệt" },
    { value: "Approved",  label: "Đã phê duyệt" },
    { value: "Rejected",  label: "Từ chối" },
    { value: "All",       label: "Tất cả các khoa" },
];

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, bgColor: "#F3F4F6", textColor: "#374151" };
    return (
        <Box sx={{ display:"inline-flex", px:1.5, py:0.4, borderRadius:10, backgroundColor: cfg.bgColor }}>
            <Typography sx={{ fontSize:12, fontWeight:700, color: cfg.textColor, whiteSpace:"nowrap" }}>
                {cfg.label}
            </Typography>
        </Box>
    );
}

// ── InfoPanel ─────────────────────────────────────────────────────────────────
function InfoPanel({ role }) {
    const isAdmin = role === "Admin";
    return (
        <Paper variant="outlined" sx={{ p:2, mb:2.5, borderColor:"#BFDBFE", backgroundColor:"#EFF6FF", borderRadius:2 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <InfoOutlinedIcon sx={{ color:"#2563EB", mt:0.2, flexShrink:0 }} />
                <Box>
                    <Typography sx={{ fontWeight:800, color:"#1D4ED8", mb:0.5, fontSize:14 }}>
                        {isAdmin
                            ? "Quy tắc phê duyệt ca khám Trưởng khoa"
                            : "Quy tắc nghiệp vụ & Chính sách phân quyền Trưởng Khoa"}
                    </Typography>
                    {isAdmin ? (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.6 }}>
                            Nhằm đảm bảo tính minh bạch và tuân thủ quy chế phòng khám,{" "}
                            <strong>Trưởng khoa không được tự duyệt yêu cầu ca khám của chính mình</strong>.
                            Chỉ Super Admin / Ban Giám đốc mới có thẩm quyền phê duyệt các yêu cầu đăng ký ca làm việc và phân bổ phòng chuyên môn này.
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.6 }}>
                            <strong>Quy tắc duyệt:</strong> Hệ thống tự động kiểm tra trùng giờ bác sĩ và trùng phòng khám theo thời gian thực
                            (Pre-flight Conflict Validation).{" "}
                            <strong>Trưởng khoa không tự duyệt yêu cầu của chính mình</strong> (yêu cầu sẽ tự động chuyển lên Ban Giám Đốc/Admin
                            xử lý theo chuẩn RBAC). Yêu cầu sau khi duyệt thành công sẽ lập tức{" "}
                            <strong>kích hoạt lịch sinh slot</strong> cho bệnh nhân đặt lịch trên ứng dụng và Cổng Bệnh nhân.
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}

// ── DoctorAvatar ──────────────────────────────────────────────────────────────
function DoctorAvatar({ name }) {
    const initials = name?.trim()?.split(" ").pop()?.slice(0, 2).toUpperCase() || "BS";
    const colors = ["#005DAC","#0284C7","#0D9488","#7C3AED","#B45309"];
    const colorIdx = (name?.charCodeAt(0) || 0) % colors.length;
    return (
        <Avatar sx={{ width:34, height:34, bgcolor: colors[colorIdx], fontSize:13, fontWeight:800, flexShrink:0 }}>
            {initials}
        </Avatar>
    );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (
        <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography variant="body2" sx={{ minWidth:140, color:"#6B7280", fontWeight:600, flexShrink:0 }}>{label}:</Typography>
            {typeof value === "string" || typeof value === "number"
                ? <Typography variant="body2" sx={{ fontWeight:700, color:"#111827" }}>{value}</Typography>
                : value}
        </Stack>
    );
}

// ── ApproveDialog ─────────────────────────────────────────────────────────────
function ApproveDialog({ detail, working, onClose, onConfirm }) {
    if (!detail) return null;
    const dur = durationHours(detail.startTime, detail.endTime);
    return (
        <Dialog open onClose={() => !working && onClose()} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight:800, fontSize:17, pb:1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon color="success" />
                    <span>Xác nhận Phê duyệt Ca khám</span>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt:2 }}>
                <Stack spacing={1.5}>
                    <InfoRow label="Bác sĩ đề xuất"  value={detail.doctorName} />
                    <InfoRow label="Thời gian khám"   value={`${dateText(detail.workDate)} (${timeText(detail.startTime)}–${timeText(detail.endTime)}${dur ? `, ${dur} giờ` : ""})`} />
                    <InfoRow label="Phòng lâm sàng"   value={detail.roomName || "–"} />
                    <Paper variant="outlined" sx={{ p:1.5, borderRadius:1.5, backgroundColor:"#F0FDF4", borderColor:"#86EFAC" }}>
                        <Typography variant="body2" sx={{ color:"#15803D", lineHeight:1.6 }}>
                            <strong>Ca thể tự động hóa:</strong> Hệ thống sẽ cập nhật trạng thái lịch là <strong>Approved</strong> và
                            mở {dur || "?"} tiếng khám bệnh nhân trên Cổng Bệnh nhân.
                        </Typography>
                    </Paper>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px:3, pb:2 }}>
                <Button variant="outlined" onClick={onClose} disabled={working}>Hủy bỏ</Button>
                <Button variant="contained" color="success"
                    startIcon={working ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                    disabled={working} onClick={onConfirm} sx={{ fontWeight:800 }}>
                    Xác nhận Phê duyệt
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── RejectDialog ──────────────────────────────────────────────────────────────
function RejectDialog({ detail, working, onClose, onConfirm }) {
    const [reason, setReason] = useState("");
    if (!detail) return null;
    return (
        <Dialog open onClose={() => !working && onClose()} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight:800, fontSize:17, pb:0.5, color:"#DC2626" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CancelOutlinedIcon color="error" />
                    <span>Từ chối yêu cầu ca khám</span>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight:400, mt:0.25 }}>
                    Gửi lý do từ chối rõ ràng
                </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt:2 }}>
                <Stack spacing={1.5}>
                    <InfoRow label="Bác sĩ đề xuất"  value={detail.doctorName} />
                    <InfoRow label="Ca ngày"          value={`${dateText(detail.workDate)} (${timeText(detail.startTime)}–${timeText(detail.endTime)})`} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.5 }}>
                        Thông báo từ chối sẽ được gửi tới bác sĩ qua hệ thống thông báo nội bộ.
                    </Typography>
                    <TextField
                        multiline minRows={3} maxRows={6}
                        label="Lý do từ chối duyệt *"
                        placeholder="Nhập chi tiết lý do từ chối..."
                        inputProps={{ maxLength:500 }}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        helperText={`${reason.length}/500 ký tự`}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px:3, pb:2 }}>
                <Button variant="outlined" onClick={onClose} disabled={working}>Hủy bỏ</Button>
                <Button variant="contained" color="error"
                    startIcon={working ? <CircularProgress size={16} color="inherit" /> : <CancelOutlinedIcon />}
                    disabled={working || reason.trim().length < 5}
                    onClick={() => onConfirm(reason.trim())}
                    sx={{ fontWeight:800 }}>
                    Gửi thông báo Từ chối
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── DetailDialog ──────────────────────────────────────────────────────────────
function DetailDialog({ detail, onClose }) {
    if (!detail) return null;
    const cfg = STATUS_CONFIG[detail.status] || { label: detail.status, bgColor:"#F3F4F6", textColor:"#374151" };
    const dur = durationHours(detail.startTime, detail.endTime);
    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight:800, pb:1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <FactCheckOutlinedIcon color="primary" />
                    <span>Chi tiết yêu cầu #{detail.requestId}</span>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt:2 }}>
                <Stack spacing={1.5}>
                    <InfoRow label="Bác sĩ đề xuất"  value={detail.doctorName} />
                    {detail.departmentName && <InfoRow label="Khoa" value={detail.departmentName} />}
                    <InfoRow label="Ngày khám"        value={`${dayOfWeek(detail.workDate)}, ${dateText(detail.workDate)}`} />
                    <InfoRow label="Khung giờ"        value={`${timeText(detail.startTime)} – ${timeText(detail.endTime)}${dur ? ` (${dur} giờ)` : ""}`} />
                    {detail.roomName && <InfoRow label="Phòng khám" value={detail.roomName} />}
                    <InfoRow label="Trạng thái"
                        value={
                            <Box sx={{ display:"inline-flex", px:1.5, py:0.3, borderRadius:10, backgroundColor: cfg.bgColor }}>
                                <Typography sx={{ fontSize:12, fontWeight:700, color: cfg.textColor }}>{cfg.label}</Typography>
                            </Box>
                        }
                    />
                    {detail.rejectReason && (
                        <Paper variant="outlined" sx={{ p:1.5, borderRadius:1.5, borderColor:"#FCA5A5", backgroundColor:"#FEF2F2" }}>
                            <Typography variant="caption" sx={{ fontWeight:700, color:"#991B1B" }}>Lý do từ chối:</Typography>
                            <Typography variant="body2" sx={{ mt:0.5, color:"#991B1B" }}>{detail.rejectReason}</Typography>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px:3, pb:2 }}>
                <Button variant="outlined" onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ScheduleReviewPage() {
    const { role, user } = useAuth();
    const isAdmin = role === "Admin";
    const tabsConfig = isAdmin ? ADMIN_TABS : HEAD_TABS;

    const [activeTab,   setActiveTab]   = useState(0);
    const [tabCounts,   setTabCounts]   = useState({});
    const [search,      setSearch]      = useState("");
    const [workDate,    setWorkDate]    = useState("");
    const [roomFilter,  setRoomFilter]  = useState("all");
    const [pageNumber,  setPageNumber]  = useState(1);
    const PAGE_SIZE = 10;

    const [list,    setList]    = useState({ items:[], totalItems:0, totalPages:0 });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");
    const [success, setSuccess] = useState("");

    const [detailItem,  setDetailItem]  = useState(null);
    const [approveItem, setApproveItem] = useState(null);
    const [rejectItem,  setRejectItem]  = useState(null);
    const [working,     setWorking]     = useState(false);

    const currentTab = tabsConfig[activeTab] || tabsConfig[0];
    const apiStatus = (currentTab.value === "Mine" || currentTab.value === "All") ? undefined : currentTab.value;

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError("");
        try {
            const params = { pageNumber, pageSize: PAGE_SIZE };
            if (apiStatus) params.status = apiStatus;
            const data = await scheduleRequestApi.list(params);
            setList(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            if (!silent) setLoading(false);
        }
    }, [apiStatus, pageNumber]);

    // refresh tab counts
    useEffect(() => {
        ["Pending","Approved","Rejected","Cancelled"].forEach(async (s) => {
            try {
                const d = await scheduleRequestApi.list({ status: s, pageNumber: 1, pageSize: 1 });
                setTabCounts(prev => ({ ...prev, [s]: d.totalItems }));
            } catch { /* ignore */ }
        });
    }, [success]);

    useEffect(() => { load(); }, [load]);

    // client-side filtering
    const filteredItems = list.items.filter(item => {
        const q = search.toLowerCase();
        if (q && !(
            item.doctorName?.toLowerCase().includes(q) ||
            String(item.requestId).includes(q) ||
            item.roomName?.toLowerCase().includes(q)
        )) return false;
        if (workDate && item.workDate !== workDate) return false;
        if (roomFilter !== "all" && item.roomName !== roomFilter) return false;
        return true;
    });

    const rooms = [...new Set(list.items.map(i => i.roomName).filter(Boolean))];

    async function handleApprove() {
        setWorking(true); setError("");
        try {
            await scheduleRequestApi.approve(approveItem.requestId);
            setSuccess(`Đã phê duyệt yêu cầu #${approveItem.requestId} thành công.`);
            setApproveItem(null);
            await load(true);
        } catch (err) {
            if ([409, 403].includes(err.response?.status)) load(true);
            setError(getApiErrorMessage(err));
        } finally { setWorking(false); }
    }

    async function handleReject(reason) {
        setWorking(true); setError("");
        try {
            await scheduleRequestApi.reject(rejectItem.requestId, reason);
            setSuccess(`Đã từ chối yêu cầu #${rejectItem.requestId}.`);
            setRejectItem(null);
            await load(true);
        } catch (err) {
            if ([409, 403].includes(err.response?.status)) load(true);
            setError(getApiErrorMessage(err));
        } finally { setWorking(false); }
    }

    function handleTabChange(_, newValue) {
        setActiveTab(newValue);
        setPageNumber(1);
        setSearch(""); setWorkDate(""); setRoomFilter("all");
        setError(""); setSuccess("");
    }

    const deptName = user?.departmentName || "";
    const deptCode = user?.departmentCode || "";

    return (
        <Box sx={{ maxWidth:1200, mx:"auto" }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <Paper sx={{ p:{ xs:2, md:3 }, mb:2, borderRadius:2 }}>
                <Stack direction={{ xs:"column", sm:"row" }} justifyContent="space-between"
                    alignItems={{ sm:"flex-start" }} spacing={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FactCheckOutlinedIcon sx={{ color:"#005DAC" }} />
                            <Typography variant="h5" fontWeight={900} color="#111827">
                                {isAdmin
                                    ? "Duyệt yêu cầu ca khám – Trưởng các Khoa lâm sàng"
                                    : `Duyệt yêu cầu đăng ký ca khám${deptName ? ` - ${deptName}` : ""}`}
                            </Typography>
                        </Stack>
                        {!isAdmin && (
                            <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap" alignItems="center">
                                {user?.fullName && (
                                    <Typography variant="body2" color="text.secondary">
                                        Phụ trách: <strong>{user.fullName}</strong>
                                    </Typography>
                                )}
                                {deptCode && (
                                    <Typography variant="body2" color="text.secondary">
                                        Mã khoa:{" "}
                                        <Chip label={deptCode} size="small"
                                            sx={{ fontWeight:800, bgcolor:"#DBEAFE", color:"#1D4ED8", height:20, fontSize:12 }} />
                                    </Typography>
                                )}
                                {deptName && (
                                    <Typography variant="caption" color="text.secondary">
                                        Chỉ hiển thị bác sĩ thuộc {deptName}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                        {isAdmin && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>
                                Hàng đợi lập đốc riêng cho Quản trị viên | Ban Giám Đốc xử lý yêu cầu đăng ký ca trực của Trưởng khoa (Department Heads).
                            </Typography>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1} flexShrink={0}>
                        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} size="small"
                            sx={{ whiteSpace:"nowrap", fontWeight:700 }}>
                            Xuất Báo Cáo Ca
                        </Button>
                        <Button variant="contained" startIcon={<RefreshOutlinedIcon />} size="small"
                            onClick={() => load()} sx={{ whiteSpace:"nowrap", fontWeight:700 }}>
                            Làm Mới Dữ Liệu
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* ── Info panel ─────────────────────────────────────────── */}
            <InfoPanel role={role} />

            {/* ── Alerts ─────────────────────────────────────────────── */}
            {error   && <Alert severity="error"   sx={{ mb:2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb:2 }} onClose={() => setSuccess("")}>{success}</Alert>}

            {/* ── Main card ──────────────────────────────────────────── */}
            <Paper sx={{ borderRadius:2, overflow:"hidden" }}>

                {/* Tabs */}
                <Box sx={{ borderBottom:"1px solid #E5E9F0" }}>
                    <Tabs value={activeTab} onChange={handleTabChange}
                        variant="scrollable" scrollButtons="auto"
                        sx={{
                            px:2,
                            "& .MuiTab-root": { fontWeight:700, minHeight:52, textTransform:"none", fontSize:14 },
                            "& .Mui-selected": { color:"#005DAC" },
                            "& .MuiTabs-indicator": { backgroundColor:"#005DAC", height:3 },
                        }}>
                        {tabsConfig.map((tab, idx) => {
                            const count = tabCounts[tab.value];
                            return (
                                <Tab key={tab.value}
                                    label={
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            {tab.value === "Mine" && <PersonOutlineOutlinedIcon sx={{ fontSize:15 }} />}
                                            <span>{tab.label}</span>
                                            {count !== undefined && (
                                                <Chip label={count} size="small" sx={{
                                                    height:20, minWidth:24, fontSize:11, fontWeight:800,
                                                    bgcolor: activeTab === idx ? "#DBEAFE" : "#F3F4F6",
                                                    color:  activeTab === idx ? "#1D4ED8" : "#6B7280",
                                                }} />
                                            )}
                                        </Stack>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Box>

                {/* Filter bar */}
                <Box sx={{ px:2, py:1.5, borderBottom:"1px solid #F3F4F6", backgroundColor:"#FAFAFA" }}>
                    <Stack direction={{ xs:"column", sm:"row" }} spacing={1.5}
                        alignItems={{ sm:"center" }} flexWrap="wrap">
                        <TextField size="small"
                            placeholder={isAdmin ? "Nhập tên GS, PGS, TS.BS hoặc mã nhân sự..." : "Nhập tên Bác sĩ / Mã yêu cầu..."}
                            value={search} onChange={e => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlinedIcon sx={{ fontSize:18, color:"#9CA3AF" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth:240, flex:1 }}
                        />
                        <TextField size="small" type="date" label="Ngày khám"
                            value={workDate} onChange={e => setWorkDate(e.target.value)}
                            InputLabelProps={{ shrink:true }} sx={{ minWidth:160 }}
                        />
                        <TextField select size="small"
                            label={isAdmin ? "Lọc theo khoa lâm sàng" : "Phòng khám"}
                            value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
                            sx={{ minWidth:200 }}>
                            <MenuItem value="all">{isAdmin ? "Tất cả khoa" : "Tất cả phòng"}</MenuItem>
                            {rooms.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </TextField>
                        <Tooltip title="Làm mới danh sách">
                            <IconButton size="small" onClick={() => load()}
                                sx={{ border:"1px solid #E5E9F0" }}>
                                <RefreshOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor:"#F8FAFC" }}>
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12, py:1.5 }}>MÃ YÊU CẦU</TableCell>
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>
                                    {isAdmin ? "TRƯỞNG KHOA ĐỀ XUẤT" : "BÁC SĨ ĐỀ XUẤT"}
                                </TableCell>
                                {isAdmin && <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>CHUYÊN KHOA</TableCell>}
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>NGÀY KHÁM</TableCell>
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>KHUNG GIỜ</TableCell>
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>PHÒNG KHÁM</TableCell>
                                {!isAdmin && <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>THỜI GIAN GỬI</TableCell>}
                                <TableCell sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>TRẠNG THÁI</TableCell>
                                <TableCell align="right" sx={{ fontWeight:800, color:"#374151", fontSize:12 }}>THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length:3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: isAdmin ? 7 : 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 7 : 8} align="center" sx={{ py:6 }}>
                                        <Stack alignItems="center" spacing={1}>
                                            <FactCheckOutlinedIcon sx={{ fontSize:40, color:"#D1D5DB" }} />
                                            <Typography color="text.secondary">Không có yêu cầu nào.</Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const isConflict = item.isConflict;
                                    const dur = durationHours(item.startTime, item.endTime);
                                    const yr = new Date().getFullYear();
                                    const reqCode = `SCH-${yr}-${String(item.requestId).padStart(4, "0")}`;
                                    return (
                                        <TableRow key={item.requestId} hover
                                            sx={{
                                                borderLeft: isConflict ? "3px solid #EF4444" : "3px solid transparent",
                                                "&:hover": { backgroundColor:"#F8FAFC" },
                                            }}>

                                            {/* Mã yêu cầu */}
                                            <TableCell>
                                                <Typography sx={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#005DAC", whiteSpace:"nowrap" }}>
                                                    {reqCode}
                                                </Typography>
                                            </TableCell>

                                            {/* Bác sĩ / Trưởng khoa */}
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <DoctorAvatar name={item.doctorName} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700} sx={{ color:"#111827" }}>
                                                            {item.doctorName}
                                                        </Typography>
                                                        {item.departmentName && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display:"block" }}>
                                                                {item.departmentName}
                                                            </Typography>
                                                        )}
                                                        {item.doctorCode && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display:"block" }}>
                                                                Mã BS: {item.doctorCode}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* Chuyên khoa (Admin only) */}
                                            {isAdmin && (
                                                <TableCell>
                                                    {item.departmentName && (
                                                        <Chip label={item.departmentName} size="small"
                                                            sx={{ fontSize:11, fontWeight:700, bgcolor:"#EDE9FE", color:"#5B21B6" }} />
                                                    )}
                                                </TableCell>
                                            )}

                                            {/* Ngày khám */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}
                                                    sx={{ color:"#111827", whiteSpace:"nowrap" }}>
                                                    {dateText(item.workDate)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dayOfWeek(item.workDate)}
                                                </Typography>
                                            </TableCell>

                                            {/* Khung giờ */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}
                                                    sx={{ color: item.status === "Pending" ? "#059669" : "#111827", whiteSpace:"nowrap" }}>
                                                    {timeText(item.startTime)} – {timeText(item.endTime)}
                                                </Typography>
                                                {dur && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dur} giờ
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Phòng khám */}
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}
                                                        sx={{ color: isConflict ? "#DC2626" : "#111827" }}>
                                                        {item.roomName || "–"}
                                                    </Typography>
                                                    {isConflict && (
                                                        <Tooltip title="Xung đột phòng">
                                                            <WarningAmberOutlinedIcon sx={{ fontSize:16, color:"#EF4444" }} />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                                {isConflict && item.conflictDetails && (
                                                    <Typography variant="caption" sx={{ color:"#DC2626", fontSize:11, display:"block" }}>
                                                        Trùng với: {item.conflictDetails}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Thời gian gửi (DepartmentHead) */}
                                            {!isAdmin && (
                                                <TableCell>
                                                    {item.createdAt ? (
                                                        <>
                                                            <Typography variant="body2"
                                                                sx={{ color:"#6B7280", whiteSpace:"nowrap", fontSize:12 }}>
                                                                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize:11 }}>
                                                                {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}
                                                            </Typography>
                                                        </>
                                                    ) : <Typography variant="body2" color="text.secondary">–</Typography>}
                                                </TableCell>
                                            )}

                                            {/* Trạng thái */}
                                            <TableCell>
                                                <StatusBadge status={item.status} />
                                            </TableCell>

                                            {/* Thao tác */}
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap">
                                                    {item.canReview ? (
                                                        <>
                                                            <Button size="small" variant="contained" color="primary"
                                                                startIcon={<CheckCircleOutlineIcon sx={{ fontSize:15 }} />}
                                                                onClick={() => setApproveItem(item)}
                                                                sx={{ fontWeight:800, fontSize:12, px:1.5, py:0.5, whiteSpace:"nowrap" }}>
                                                                Duyệt ca
                                                            </Button>
                                                            <Button size="small" variant="outlined" color="error"
                                                                startIcon={<BlockOutlinedIcon sx={{ fontSize:15 }} />}
                                                                onClick={() => setRejectItem(item)}
                                                                sx={{ fontWeight:800, fontSize:12, px:1.5, py:0.5, whiteSpace:"nowrap" }}>
                                                                Từ chối
                                                            </Button>
                                                        </>
                                                    ) : item.status === "Pending" ? (
                                                        <Chip
                                                            label={isAdmin ? "Chỉ Ban Giám Đốc đặc xử lý" : "Chờ Admin duyệt"}
                                                            size="small" variant="outlined"
                                                            sx={{ fontSize:11, color:"#6B7280" }} />
                                                    ) : null}
                                                    <Tooltip title="Xem chi tiết">
                                                        <IconButton size="small" onClick={() => setDetailItem(item)}
                                                            sx={{ border:"1px solid #E5E9F0" }}>
                                                            <VisibilityOutlinedIcon sx={{ fontSize:16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination footer */}
                <Box sx={{ px:2.5, py:1.5, borderTop:"1px solid #F3F4F6", backgroundColor:"#FAFAFA" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between"
                        flexWrap="wrap" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                            Hiển thị <strong>{filteredItems.length}</strong> trong tổng số{" "}
                            <strong>{list.totalItems}</strong> yêu cầu ca khám
                            {!isAdmin && deptName ? ` của ${deptName}` : ""}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Button size="small" variant="outlined"
                                disabled={pageNumber <= 1}
                                onClick={() => setPageNumber(v => v - 1)}
                                sx={{ minWidth:60, fontWeight:700 }}>
                                Trước
                            </Button>
                            {Array.from({ length: Math.min(Math.max(1, list.totalPages), 5) }).map((_, idx) => {
                                const p = idx + 1;
                                return (
                                    <Button key={p} size="small"
                                        variant={pageNumber === p ? "contained" : "outlined"}
                                        onClick={() => setPageNumber(p)}
                                        sx={{ minWidth:36, fontWeight:700, px:0 }}>
                                        {p}
                                    </Button>
                                );
                            })}
                            <Button size="small" variant="outlined"
                                disabled={pageNumber >= list.totalPages}
                                onClick={() => setPageNumber(v => v + 1)}
                                sx={{ minWidth:60, fontWeight:700 }}>
                                Sau
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>

            {/* ── Dialogs ─────────────────────────────────────────────── */}
            {approveItem && (
                <ApproveDialog detail={approveItem} working={working}
                    onClose={() => setApproveItem(null)} onConfirm={handleApprove} />
            )}
            {rejectItem && (
                <RejectDialog detail={rejectItem} working={working}
                    onClose={() => setRejectItem(null)} onConfirm={handleReject} />
            )}
            {detailItem && (
                <DetailDialog detail={detailItem} onClose={() => setDetailItem(null)} />
            )}
        </Box>
    );
}
