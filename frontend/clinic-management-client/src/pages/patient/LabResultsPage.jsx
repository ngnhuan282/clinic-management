import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, InputAdornment, LinearProgress, MenuItem, Pagination, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { FilterListOutlined, RefreshOutlined, RestartAltOutlined, ScienceOutlined, SearchOutlined, VisibilityOutlined } from "@mui/icons-material";
import useLabOrders from "../../hooks/useLabOrders";
import LabResultDialog from "../../components/common/LabResultDialog";
import { positiveId } from "../../utils/notificationNavigation";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import { clinicButtonSx, clinicColors, clinicFieldSx, clinicSecondaryButtonSx, clinicSurfaceSx } from "../../components/common/clinicUi";

const dateText = value => value ? new Date(value).toLocaleDateString("vi-VN") : "–";
const pageSize = 10;

function LabStatus({ status }) {
    const completed = status === "Completed";
    const pending = status === "Pending";
    const label = completed ? "Đã có kết quả" : pending ? "Đang chờ" : status === "Cancelled" ? "Đã hủy" : status;
    return <Chip size="small" label={label} sx={{ bgcolor: completed ? "#ECFDF5" : pending ? "#FFFBEB" : "#F1F5F9", color: completed ? "#047857" : pending ? "#92400E" : "#64748B", fontWeight: 500 }} />;
}

function ResultContent({ order }) {
    return order.result ? <Stack spacing={1.5}>
        <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: clinicColors.muted, mb: 0.75 }}>Kết quả xét nghiệm</Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: clinicColors.heading }}>{order.result.resultSummary}</Typography>
        </Box>
        {order.result.note && <Typography sx={{ fontSize: 14, color: clinicColors.muted, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Ghi chú: {order.result.note}</Typography>}
        {order.result.performedAt && <Typography sx={{ fontSize: 12, color: clinicColors.muted }}>Thực hiện ngày {dateText(order.result.performedAt)}</Typography>}
    </Stack> : <Typography sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, color: clinicColors.muted, fontSize: 14, lineHeight: 1.7 }}>{order.status === "Cancelled" ? "Chỉ định này đã được hủy." : "Chưa có kết quả. Bạn có thể làm mới danh sách để kiểm tra lại sau."}</Typography>;
}

export default function LabResultsPage() {
    const { orders, loading, error, reload: loadOrders } = useLabOrders();
    const [params, setParams] = useSearchParams();
    const selectedLabId = positiveId(params.get("labTestId"));
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => orders.filter(order => {
        const query = search.trim().toLocaleLowerCase("vi");
        return (!query || `${order.id} ${order.labTestTypeName}`.toLocaleLowerCase("vi").includes(query))
            && (!status || order.status === status);
    }), [orders, search, status]);
    const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
    const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const reset = () => { setSearch(""); setStatus(""); setPage(0); };
    const openDetail = id => setParams(current => { current.set("labTestId", String(id)); return current; });
    const closeDetail = () => setParams(current => { current.delete("labTestId"); return current; });

    return <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
            <ClinicPageHeader title="Kết quả xét nghiệm" icon={ScienceOutlined} description="Theo dõi các chỉ định và đọc kết quả xét nghiệm trong hồ sơ của bạn." />
            {error && <Alert severity="error" action={<Button color="inherit" onClick={loadOrders}>Thử lại</Button>}>{error}</Alert>}
            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}><FilterListOutlined sx={{ fontSize: 18, color: clinicColors.muted }} /><Typography sx={{ fontSize: 14, fontWeight: 600 }}>Tìm kết quả xét nghiệm</Typography></Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <TextField fullWidth size="small" label="Tìm xét nghiệm" placeholder="Tên hoặc mã chỉ định" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} sx={{ ...clinicFieldSx, flex: 1.4 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 20, color: "#94A3B8" }} /></InputAdornment> } }} />
                    <TextField select fullWidth size="small" label="Trạng thái" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} sx={{ ...clinicFieldSx, flex: 1 }}><MenuItem value="">Tất cả trạng thái</MenuItem><MenuItem value="Completed">Đã có kết quả</MenuItem><MenuItem value="Pending">Đang chờ</MenuItem><MenuItem value="Cancelled">Đã hủy</MenuItem></TextField>
                    <Button onClick={reset} startIcon={<RestartAltOutlined />} sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}>Đặt lại bộ lọc</Button>
                    <Button variant="outlined" disabled={loading} onClick={loadOrders} startIcon={<RefreshOutlined />} sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}>Làm mới dữ liệu</Button>
                </Stack>
            </Paper>
            <Box aria-busy={loading}>
                {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} aria-label="Đang tải kết quả xét nghiệm" />}
                {!loading && !error && <Typography sx={{ mb: 2, fontSize: 13, color: clinicColors.muted }}>{filtered.length} chỉ định phù hợp</Typography>}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    {loading ? Array.from({ length: 4 }, (_, index) => <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3 }}><Stack spacing={2}><Skeleton width="70%" height={30} /><Skeleton width="40%" /><Skeleton variant="rounded" height={110} /></Stack></Paper>) : !error && visible.map(order => <Paper key={order.id} variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 } }}>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                                <Box sx={{ minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, overflowWrap: "anywhere" }}>{order.labTestTypeName}</Typography><Typography sx={{ mt: 0.75, fontSize: 13, color: clinicColors.muted }}>Chỉ định #{order.id} · {dateText(order.createdAt)}</Typography></Box>
                                <LabStatus status={order.status} />
                            </Stack>
                            <ResultContent order={order} />
                            <Box sx={{ borderTop: "1px solid #E2E8F0", pt: 1.5 }}><Button size="small" startIcon={<VisibilityOutlined />} aria-label={`Xem chi tiết xét nghiệm #${order.id}`} onClick={() => openDetail(order.id)} sx={clinicButtonSx}>Xem chi tiết</Button></Box>
                        </Stack>
                    </Paper>)}
                </Box>
                {!loading && !error && !visible.length && <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2 }}><EmptyState message={search || status ? "Không có xét nghiệm phù hợp với bộ lọc." : "Bạn chưa có chỉ định xét nghiệm."} /></Paper>}
            </Box>
            {!loading && !error && filtered.length > pageSize && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}><Typography sx={{ fontSize: 13, color: clinicColors.muted }}>{currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} / {filtered.length} chỉ định</Typography><Pagination count={Math.ceil(filtered.length / pageSize)} page={currentPage + 1} onChange={(_, value) => setPage(value - 1)} shape="rounded" color="primary" size="small" getItemAriaLabel={(type, value) => type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`} /></Stack>}
        </Stack>
        <LabResultDialog id={selectedLabId} onClose={closeDetail} />
    </Box>;
}
