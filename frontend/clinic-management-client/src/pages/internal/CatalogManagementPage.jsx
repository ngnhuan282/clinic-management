import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import catalogApi from "../../api/catalogApi";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";

const CONFIG = {
    departments: { title: "Khoa", singular: "khoa", fields: ["code", "name", "description"], labels: { code: "Mã khoa", name: "Tên khoa", description: "Mô tả" }, columns: ["code", "name", "description"] },
    specializations: { title: "Chuyên khoa", singular: "chuyên khoa", fields: ["code", "name", "description", "departmentId"], labels: { code: "Mã chuyên khoa", name: "Tên chuyên khoa", description: "Mô tả", departmentId: "Khoa" }, columns: ["code", "name", "departmentName"] },
    rooms: { title: "Phòng", singular: "phòng", fields: ["roomNumber", "name", "roomType", "departmentId", "location"], labels: { roomNumber: "Số phòng", name: "Tên phòng", roomType: "Loại phòng", departmentId: "Khoa", location: "Vị trí" }, columns: ["roomNumber", "name", "roomType", "departmentName", "location"] },
};
const empty = (resource) => resource === "rooms" ? { roomNumber: "", name: "", roomType: "", departmentId: "", location: "" } : resource === "specializations" ? { code: "", name: "", description: "", departmentId: "" } : { code: "", name: "", description: "" };
const idField = (resource) => resource === "departments" ? "departmentId" : resource === "specializations" ? "specializationId" : "roomId";

function CatalogManagementPage({ resource }) {
    const config = CONFIG[resource];
    const [data, setData] = useState({ items: [], totalItems: 0 }); const [departments, setDepartments] = useState([]);
    const [page, setPage] = useState(0); const [search, setSearch] = useState(""); const [active, setActive] = useState("");
    const [form, setForm] = useState(empty(resource)); const [editing, setEditing] = useState(null); const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true); setError("");
        try { const response = await catalogApi.list(resource, { pageNumber: page + 1, pageSize: 10, search: search || undefined, isActive: active === "" ? undefined : active }); setData(response.data.result || { items: [], totalItems: 0 }); }
        catch (err) { setError(err.response?.data?.message || "Không thể tải dữ liệu."); } finally { setLoading(false); }
    };
    // Synchronize the clinical table with its search and filter controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [resource, page, search, active]);
    useEffect(() => { if (resource !== "departments") catalogApi.list("departments", { pageNumber: 1, pageSize: 100, isActive: true }).then((response) => setDepartments(response.data.result?.items || [])).catch(() => setDepartments([])); }, [resource]);
    const openCreate = () => { setEditing(null); setForm(empty(resource)); setDialogOpen(true); };
    const openEdit = (item) => { setEditing(item); setForm(resource === "rooms" ? { roomNumber: item.roomNumber, name: item.name, roomType: item.roomType || "", departmentId: item.departmentId, location: item.location || "", isActive: item.isActive } : { code: item.code, name: item.name, description: item.description || "", departmentId: item.departmentId, isActive: item.isActive }); setDialogOpen(true); };
    const save = async () => { setSaving(true); try { if (editing) await catalogApi.update(resource, editing[idField(resource)], form); else await catalogApi.create(resource, form); setDialogOpen(false); setNotice("Đã lưu dữ liệu thành công."); load(); } catch (err) { setError(err.response?.data?.message || "Không thể lưu dữ liệu."); } finally { setSaving(false); } };
    const toggle = async (item) => { try { await catalogApi.updateStatus(resource, item[idField(resource)], !item.isActive); setNotice("Đã cập nhật trạng thái."); load(); } catch (err) { setError(err.response?.data?.message || "Không thể cập nhật trạng thái."); } };
    const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
    return <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
            <Box><Typography variant="h5">{config.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Quản lý danh mục và trạng thái hoạt động.</Typography></Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Thêm {config.singular}</Button>
        </Stack>
        {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}{error && <ErrorState message={error} onRetry={load} />}
        <Paper variant="outlined" sx={{ borderColor: "divider", boxShadow: "0 1px 3px rgba(15,23,42,.04)", overflow: "hidden" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
                <TextField label="Tìm kiếm" value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} sx={{ maxWidth: 360, width: "100%" }} />
                <FormControl sx={{ minWidth: 170 }}><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={active} onChange={(e) => { setPage(0); setActive(e.target.value); }}><MenuItem value="">Tất cả</MenuItem><MenuItem value="true">Đang hoạt động</MenuItem><MenuItem value="false">Ngừng hoạt động</MenuItem></Select></FormControl>
            </Stack>
            {loading ? <Loading /> : data.items?.length ? <><Table><TableHead><TableRow>{config.columns.map((column) => <TableCell key={column}>{config.labels[column] || column}</TableCell>)}<TableCell align="center">Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead><TableBody>{data.items.map((item) => <TableRow key={item[idField(resource)]}>{config.columns.map((column) => <TableCell key={column} sx={column.toLowerCase().includes("code") || column === "roomNumber" ? { fontVariantNumeric: "tabular-nums", letterSpacing: ".03em", fontWeight: 500 } : {}}>{item[column] || "-"}</TableCell>)}<TableCell align="center"><Chip size="small" label={item.isActive ? "Đang hoạt động" : "Ngừng hoạt động"} color={item.isActive ? "success" : "default"} /></TableCell><TableCell align="right"><Button size="small" onClick={() => openEdit(item)}>Sửa</Button><Switch size="small" checked={item.isActive} onChange={() => toggle(item)} inputProps={{ "aria-label": `Đổi trạng thái ${config.singular}` }} /></TableCell></TableRow>)}</TableBody></Table><TablePagination component="div" count={data.totalItems || 0} page={page} onPageChange={(_, value) => setPage(value)} rowsPerPage={10} rowsPerPageOptions={[10]} labelRowsPerPage="Số dòng" /></> : <EmptyState message={`Chưa có ${config.singular} nào.`} />}
        </Paper>
        <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{editing ? `Sửa ${config.singular}` : `Thêm ${config.singular}`}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{config.fields.map((field) => field === "departmentId" ? <FormControl key={field} fullWidth required><InputLabel>Khoa</InputLabel><Select label="Khoa" value={form.departmentId || ""} onChange={(e) => setField("departmentId", e.target.value)}>{departments.map((department) => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}</Select></FormControl> : <TextField key={field} label={config.labels[field]} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} required={!["description", "roomType", "location"].includes(field)} multiline={field === "description"} />)}</Stack></DialogContent><DialogActions><Button onClick={() => setDialogOpen(false)} disabled={saving}>Hủy</Button><Button variant="contained" onClick={save} disabled={saving}>Lưu</Button></DialogActions></Dialog>
    </Stack>;
}

export default CatalogManagementPage;
