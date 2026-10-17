import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AddOutlined, EditOutlined, FilterListOutlined, RefreshOutlined, RestartAltOutlined, ScienceOutlined, SearchOutlined, VisibilityOffOutlined } from "@mui/icons-material";
import { labTestTypeApi } from "../../api/labTestTypeApi";
import LabTestTypeModal from "./LabTestTypeModal";
import useAuth from "../../hooks/useAuth";
import getApiErrorMessage from "../../utils/errorHandler";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import { clinicButtonSx, clinicColors, clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx, clinicSurfaceSx, clinicTableSx } from "../../components/common/clinicUi";

const formatCurrency = value => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function LabTestTypesPage() {
    const { role, permissions } = useAuth();
    const canEdit = role === "Admin" && permissions.includes("labs.manageTypes");
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [hideTarget, setHideTarget] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const listRequest = useRef(0);
    const invalidateList = useCallback(() => { listRequest.current++; }, []);

    const fetchList = useCallback(async () => {
        const requestId = ++listRequest.current;
        setLoading(true);
        setError("");
        try {
            const response = await labTestTypeApi.getAll(true);
            const rawData = response?.data?.data || response?.data?.items || response?.data;
            if (requestId === listRequest.current) setList(Array.isArray(rawData) ? rawData : []);
        } catch (requestError) {
            if (requestId === listRequest.current) { setError(getApiErrorMessage(requestError)); setList([]); }
        } finally { if (requestId === listRequest.current) setLoading(false); }
    }, []);
    useEffect(() => {
        const timer = setTimeout(() => { void fetchList(); }, 0);
        return () => { clearTimeout(timer); invalidateList(); };
    }, [fetchList, invalidateList]);

    const filtered = useMemo(() => list.filter(item => {
        const query = search.trim().toLocaleLowerCase("vi");
        return (!query || `${item.id} ${item.name} ${item.description || ""}`.toLocaleLowerCase("vi").includes(query))
            && (!status || item.isActive === (status === "active"));
    }), [list, search, status]);
    const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
    const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const reset = () => { setSearch(""); setStatus(""); setPage(0); };
    const openForm = item => { setSelectedItem(item); setActionError(""); setSuccess(""); setIsModalOpen(true); };
    const submit = async data => {
        if (saving || !canEdit) return;
        setSaving(true); setActionError("");
        try {
            if (selectedItem) await labTestTypeApi.update(selectedItem.id, data);
            else await labTestTypeApi.create(data);
            setIsModalOpen(false);
            setSuccess(selectedItem ? "Đã cập nhật loại xét nghiệm." : "Đã thêm loại xét nghiệm.");
            await fetchList();
        } catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
        finally { setSaving(false); }
    };
    const hide = async () => {
        if (saving || !hideTarget || !canEdit) return;
        setSaving(true); setActionError("");
        try {
            await labTestTypeApi.delete(hideTarget.id);
            setHideTarget(null); setSuccess("Đã ngừng sử dụng loại xét nghiệm.");
            await fetchList();
        } catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
        finally { setSaving(false); }
    };

    return <Stack spacing={2.5} sx={{ pb: 4, minWidth: 0 }}>
        <ClinicPageHeader title="Danh mục xét nghiệm" icon={ScienceOutlined} description="Thông tin dịch vụ, đơn giá và trạng thái sử dụng của các loại xét nghiệm."
            actions={canEdit && <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openForm(null)} sx={clinicPrimaryButtonSx}>Thêm loại xét nghiệm</Button>} />
        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" action={<Button color="inherit" onClick={fetchList}>Thử lại</Button>}>{error}</Alert>}
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}><FilterListOutlined sx={{ color: clinicColors.muted, fontSize: 18 }} /><Typography sx={{ fontSize: 14, fontWeight: 600 }}>Bộ lọc danh mục</Typography></Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField fullWidth size="small" label="Tìm loại xét nghiệm" placeholder="Tên, mô tả hoặc mã xét nghiệm" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} sx={{ ...clinicFieldSx, flex: 1.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ color: "#94A3B8", fontSize: 20 }} /></InputAdornment> } }} />
                <TextField select fullWidth size="small" label="Trạng thái" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} sx={{ ...clinicFieldSx, flex: 1 }}><MenuItem value="">Tất cả trạng thái</MenuItem><MenuItem value="active">Đang sử dụng</MenuItem><MenuItem value="inactive">Ngừng sử dụng</MenuItem></TextField>
                <Button onClick={reset} startIcon={<RestartAltOutlined />} sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}>Đặt lại bộ lọc</Button>
                <Button variant="outlined" disabled={loading} onClick={fetchList} startIcon={<RefreshOutlined />} sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}>Làm mới dữ liệu</Button>
            </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
            <Stack direction="row" spacing={1} sx={{ p: 2.5, alignItems: "center", borderBottom: "1px solid #E2E8F0" }}><Typography sx={{ fontWeight: 600 }}>Các loại xét nghiệm</Typography>{!loading && <Chip size="small" label={`${filtered.length} loại`} sx={{ bgcolor: "#F0F9FF", color: "#0369A1" }} />}</Stack>
            {loading && <LinearProgress />}
            <TableContainer sx={{ overflowX: "auto" }}><Table aria-label="Danh mục xét nghiệm" sx={{ ...clinicTableSx, minWidth: 780 }}><TableHead><TableRow><TableCell>Mã</TableCell><TableCell>Tên xét nghiệm / mô tả</TableCell><TableCell align="right">Đơn giá</TableCell><TableCell>Trạng thái</TableCell>{canEdit && <TableCell align="right">Thao tác</TableCell>}</TableRow></TableHead><TableBody>
                {loading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: canEdit ? 5 : 4 }, (_, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>) : visible.length ? visible.map(item => <TableRow key={item.id} hover>
                    <TableCell sx={{ color: clinicColors.muted }}>#{item.id}</TableCell>
                    <TableCell sx={{ maxWidth: 420 }}><Typography sx={{ fontSize: 14, fontWeight: 600, color: clinicColors.heading }}>{item.name}</Typography><Typography sx={{ mt: 0.5, color: clinicColors.muted, fontSize: 13, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.description || "Chưa có mô tả"}</Typography></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(item.price)}</TableCell>
                    <TableCell><Chip size="small" label={item.isActive ? "Đang sử dụng" : "Ngừng sử dụng"} sx={{ bgcolor: item.isActive ? "#ECFDF5" : "#F1F5F9", color: item.isActive ? "#047857" : "#64748B", fontWeight: 500 }} /></TableCell>
                    {canEdit && <TableCell align="right"><Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}><Tooltip title="Sửa loại xét nghiệm"><IconButton size="small" aria-label={`Sửa ${item.name}`} onClick={() => openForm(item)} sx={{ color: "#0284C7" }}><EditOutlined fontSize="small" /></IconButton></Tooltip>{item.isActive && <Tooltip title="Ngừng sử dụng"><IconButton size="small" aria-label={`Ngừng sử dụng ${item.name}`} onClick={() => { setActionError(""); setHideTarget(item); }} sx={{ color: "#64748B" }}><VisibilityOffOutlined fontSize="small" /></IconButton></Tooltip>}</Stack></TableCell>}
                </TableRow>) : <TableRow><TableCell colSpan={canEdit ? 5 : 4}><EmptyState message={error ? "Chưa tải được danh mục xét nghiệm." : "Không có loại xét nghiệm phù hợp."} /></TableCell></TableRow>}
            </TableBody></Table></TableContainer>
            <TablePagination component="div" count={filtered.length} page={currentPage} rowsPerPage={pageSize} rowsPerPageOptions={[10, 20, 50]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={event => { setPageSize(Number(event.target.value)); setPage(0); }} labelRowsPerPage="Số dòng:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} loại`} getItemAriaLabel={type => type === "next" ? "Trang tiếp" : "Trang trước"} disabled={loading} sx={{ borderTop: "1px solid #E2E8F0", "& .MuiTablePagination-toolbar": { flexWrap: "wrap", px: 2 }, "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 13 } }} />
        </Paper>
        <LabTestTypeModal key={`${isModalOpen}-${selectedItem?.id ?? "new"}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={submit} initialData={selectedItem} saving={saving} error={actionError} />
        <Dialog open={Boolean(hideTarget)} onClose={saving ? undefined : () => setHideTarget(null)} maxWidth="xs" fullWidth aria-labelledby="hide-lab-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
            <DialogTitle id="hide-lab-title" sx={clinicDialogTitleSx}>Ngừng sử dụng xét nghiệm</DialogTitle>
            <DialogContent><Stack spacing={2}>{actionError && <Alert severity="error">{actionError}</Alert>}<Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>Ngừng sử dụng “{hideTarget?.name}”? Loại xét nghiệm vẫn được lưu trong danh mục. Bạn có thể bật lại trạng thái khi sửa thông tin.</Typography></Stack></DialogContent>
            <DialogActions sx={clinicDialogActionsSx}><Button disabled={saving} onClick={() => setHideTarget(null)} sx={clinicSecondaryButtonSx}>Hủy</Button><Button disabled={saving} variant="contained" onClick={hide} sx={clinicPrimaryButtonSx}>{saving ? "Đang lưu..." : "Ngừng sử dụng"}</Button></DialogActions>
        </Dialog>
    </Stack>;
}
