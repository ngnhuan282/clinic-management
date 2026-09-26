import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Drawer,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import DoorFrontOutlinedIcon from "@mui/icons-material/DoorFrontOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import StethoscopeIcon from "@mui/icons-material/MedicalInformationOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import catalogApi from "../../api/catalogApi";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";

const BLUE = "#005DAC";
const CONFIG = {
    departments: {
        title: "Khoa phòng",
        singular: "khoa",
        tab: "Khoa phòng",
        fields: ["code", "name", "description"],
        labels: { code: "Mã khoa", name: "Tên khoa", description: "Mô tả" },
        columns: ["code", "name", "description"],
    },
    specializations: {
        title: "Chuyên khoa",
        singular: "chuyên khoa",
        tab: "Chuyên khoa",
        fields: ["code", "name", "description", "departmentId"],
        labels: { code: "Mã chuyên khoa", name: "Tên chuyên khoa", description: "Mô tả", departmentId: "Khoa" },
        columns: ["code", "name", "description", "departmentName"],
    },
    rooms: {
        title: "Buồng khám",
        singular: "phòng",
        tab: "Buồng khám",
        fields: ["roomNumber", "name", "roomType", "departmentId", "location"],
        labels: { roomSummary: "Mã & tên buồng khám", specialty: "Chuyên khoa", doctor: "Bác sĩ trực ca", location: "Vị trí", roomStatus: "Trạng thái", equipment: "Thiết bị tiêu biểu", roomNumber: "Số phòng", name: "Tên phòng", roomType: "Loại phòng", departmentId: "Khoa" },
        columns: ["roomSummary", "specialty", "doctor", "location", "roomStatus", "equipment"],
    },
};

const TABS = [
    { resource: "departments", label: "Khoa phòng", icon: DomainOutlinedIcon },
    { resource: "specializations", label: "Chuyên khoa", icon: StethoscopeIcon },
    { resource: "rooms", label: "Buồng khám", icon: DoorFrontOutlinedIcon },
];

const empty = (resource) =>
    resource === "rooms"
        ? { roomNumber: "", name: "", roomType: "", departmentId: "", location: "" }
        : resource === "specializations"
            ? { code: "", name: "", description: "", departmentId: "" }
            : { code: "", name: "", description: "" };

const idField = (resource) =>
    resource === "departments" ? "departmentId" : resource === "specializations" ? "specializationId" : "roomId";

const cardSx = {
    border: "none",
    borderRadius: 3,
    boxShadow: "0 2px 8px rgba(23, 28, 31, 0.06)",
    backgroundColor: "#FFFFFF",
};

function MetricCard({ label, value, suffix, icon: Icon, color = BLUE, helper }) {
    return (
        <Paper sx={{ ...cardSx, p: 2.5, minHeight: 142 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography sx={{ color: "#6B7280", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        {label}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 1 }}>
                        <Typography sx={{ color: "#1F2937", fontSize: 34, fontWeight: 700, lineHeight: 1 }}>
                            {value}
                        </Typography>
                        <Typography sx={{ color: "#6B7280", fontSize: 13 }}>{suffix}</Typography>
                    </Stack>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 3, display: "grid", placeItems: "center", color, backgroundColor: `${color}14` }}>
                    <Icon />
                </Box>
            </Stack>
            <Typography sx={{ color: "#6B7280", fontSize: 12, mt: 2.5 }}>{helper}</Typography>
        </Paper>
    );
}

function CatalogManagementPage({ resource }) {
    const config = CONFIG[resource];
    const [data, setData] = useState({ items: [], totalItems: 0 });
    const [counts, setCounts] = useState({ departments: 0, specializations: 0, rooms: 0 });
    const [departments, setDepartments] = useState([]);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [active, setActive] = useState("");
    const [form, setForm] = useState(empty(resource));
    const [editing, setEditing] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await catalogApi.list(resource, {
                pageNumber: page + 1,
                pageSize: 10,
                search: search || undefined,
                isActive: active === "" ? undefined : active,
            });
            setData(response.data.result || { items: [], totalItems: 0 });
            setSelectedItem((current) => current || response.data.result?.items?.[0] || null);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // The catalog endpoint is synchronized with the active route and filters.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
        setSelectedItem(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resource, page, search, active]);

    useEffect(() => {
        let cancelled = false;
        const loadSummary = async () => {
            const resources = Object.keys(CONFIG);
            const responses = await Promise.all(
                resources.map((name) => catalogApi.list(name, { pageNumber: 1, pageSize: 1, isActive: true })),
            );
            if (!cancelled) {
                setCounts(Object.fromEntries(resources.map((name, index) => [name, responses[index].data.result?.totalItems || 0])));
            }
        };
        loadSummary().catch(() => {});
        if (resource !== "departments") {
            catalogApi.list("departments", { pageNumber: 1, pageSize: 100, isActive: true })
                .then((response) => setDepartments(response.data.result?.items || []))
                .catch(() => setDepartments([]));
        }
        return () => { cancelled = true; };
    }, [resource]);

    const openCreate = () => {
        setEditing(null);
        setForm(empty(resource));
        setDrawerOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm(resource === "rooms"
            ? { roomNumber: item.roomNumber, name: item.name, roomType: item.roomType || "", departmentId: item.departmentId, location: item.location || "", isActive: item.isActive }
            : { code: item.code, name: item.name, description: item.description || "", departmentId: item.departmentId, isActive: item.isActive });
        setDrawerOpen(true);
    };

    const openDetail = (item) => {
        setSelectedItem(item);
        setDetailOpen(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            if (editing) await catalogApi.update(resource, editing[idField(resource)], form);
            else await catalogApi.create(resource, form);
            setDrawerOpen(false);
            setNotice("Đã lưu dữ liệu thành công.");
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể lưu dữ liệu.");
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (item) => {
        const itemId = item[idField(resource)];
        const nextActive = !item.isActive;
        const countDelta = nextActive ? 1 : -1;
        setData((current) => ({
            ...current,
            items: current.items.map((currentItem) =>
                currentItem[idField(resource)] === itemId
                    ? { ...currentItem, isActive: nextActive }
                    : currentItem,
            ),
        }));
        setCounts((current) => ({
            ...current,
            [resource]: Math.max(0, current[resource] + countDelta),
        }));
        setSelectedItem((current) =>
            current?.[idField(resource)] === itemId
                ? { ...current, isActive: nextActive }
                : current,
        );
        try {
            await catalogApi.updateStatus(resource, itemId, nextActive);
            setNotice("Đã cập nhật trạng thái.");
        } catch (err) {
            setData((current) => ({
                ...current,
                items: current.items.map((currentItem) =>
                    currentItem[idField(resource)] === itemId
                        ? { ...currentItem, isActive: item.isActive }
                        : currentItem,
                ),
            }));
            setCounts((current) => ({
                ...current,
                [resource]: Math.max(0, current[resource] - countDelta),
            }));
            setSelectedItem((current) =>
                current?.[idField(resource)] === itemId
                    ? { ...current, isActive: item.isActive }
                    : current,
            );
            setError(err.response?.data?.message || "Không thể cập nhật trạng thái.");
        }
    };

    const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
    const renderCell = (item, column) => {
        if (resource !== "rooms") return item[column] || "-";
        if (column === "roomSummary") return (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ width: 4, height: 28, borderRadius: 1, backgroundColor: item.isActive ? "#10B981" : "#CBD5E1", flexShrink: 0 }} />
                <Box>
                    <Typography sx={{ color: "#1F2937", fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{item.roomNumber} - {item.name}</Typography>
                    <Typography sx={{ color: "#9CA3AF", fontSize: 10, fontFamily: "monospace", mt: .35 }}>Mã: DEPT-{String(item.roomNumber || item.roomId).toUpperCase()}</Typography>
                </Box>
            </Box>
        );
        if (column === "specialty") return (
            <Box><Typography sx={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>{item.roomType || "Khám bệnh"}</Typography><Typography sx={{ color: "#9CA3AF", fontSize: 11, mt: .35 }}>{item.departmentName || "Chưa cập nhật khoa"}</Typography></Box>
        );
        if (column === "doctor") return (
            <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", color: BLUE, backgroundColor: "#DCEBFF", fontSize: 10, fontWeight: 800 }}>--</Box>
                <Box><Typography sx={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>Chưa phân công</Typography><Typography sx={{ color: "#9CA3AF", fontSize: 10 }}>Bác sĩ trực ca</Typography></Box>
            </Stack>
        );
        if (column === "location") return <Typography sx={{ color: "#4B5563", fontSize: 12, fontWeight: 600 }}>{item.location || "Chưa cập nhật"}</Typography>;
        if (column === "roomStatus") return <Chip size="small" label={item.isActive ? "Sẵn sàng tiếp nhận" : "Bảo trì / Tạm ngưng"} sx={{ color: item.isActive ? "#047857" : "#9F1239", backgroundColor: item.isActive ? "#ECFDF5" : "#FFF1F2", border: `1px solid ${item.isActive ? "#A7F3D0" : "#FECDD3"}`, fontSize: 10, fontWeight: 700 }} />;
        return <Typography sx={{ color: "#9CA3AF", fontSize: 11 }}>Chưa cập nhật thiết bị</Typography>;
    };
    return (
        <Box sx={{ minHeight: "100%", backgroundColor: "#F6FAFE", p: { xs: 2, md: 3 } }}>
            <Stack spacing={3}>
                <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "#6B7280", mb: 1 }}>
                        <Typography sx={{ fontSize: 12 }}>Hệ thống quản trị</Typography>
                        <ChevronRightIcon sx={{ fontSize: 15 }} />
                        <Typography sx={{ fontSize: 12 }}>Cấu hình danh mục y tế</Typography>
                        <ChevronRightIcon sx={{ fontSize: 15 }} />
                        <Typography sx={{ color: BLUE, fontSize: 12, fontWeight: 700 }}>{config.tab}</Typography>
                    </Stack>
                    <Stack direction={{ xs: "column", xl: "row" }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography sx={{ color: "#1F2937", fontSize: { xs: 25, md: 30 }, fontWeight: 700 }}>
                                Quản lý Khoa phòng, Chuyên khoa &amp; Buồng khám
                            </Typography>
                            <Typography sx={{ color: "#6B7280", fontSize: 13, mt: 0.5 }}>
                                Điều phối nguồn lực lâm sàng và cấu hình danh mục y tế trong thời gian thực.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                            <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} sx={{ color: "#374151", borderColor: "#E5E9F0", backgroundColor: "#FFF" }}>
                                Xuất danh mục
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ backgroundColor: BLUE, "&:hover": { backgroundColor: "#1565C0" } }}>
                                Thêm {config.singular}
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
                    <MetricCard label="Tổng số khoa chuyên môn" value={counts.departments} suffix="Khoa lớn" icon={DomainOutlinedIcon} helper="Khám bệnh, cận lâm sàng..." />
                    <MetricCard label="Chuyên khoa hoạt động" value={counts.specializations} suffix="Chuyên khoa" icon={StethoscopeIcon} color="#2959B3" helper="Danh mục chuyên môn đang hoạt động" />
                    <MetricCard label="Buồng khám & thủ thuật" value={counts.rooms} suffix="Buồng" icon={DoorFrontOutlinedIcon} color="#10B981" helper="Sẵn sàng đón tiếp người bệnh" />
                    <MetricCard label="Trạng thái hệ thống" value="100%" suffix="Ổn định" icon={MedicalServicesOutlinedIcon} color="#F59E0B" helper="Dữ liệu được đồng bộ với hệ thống" />
                </Box>

                <Paper sx={{ ...cardSx, overflow: "hidden" }}>
                    <Stack direction="row" spacing={3} sx={{ px: { xs: 2, md: 3 }, pt: 1.5, borderBottom: "1px solid #E5E9F0", overflowX: "auto" }}>
                        {TABS.map(({ resource: tabResource, label, icon: Icon }) => (
                            <Button
                                key={tabResource}
                                href={`/internal/${tabResource}`}
                                startIcon={<Icon />}
                                sx={{ flexShrink: 0, borderRadius: 0, minHeight: 50, color: resource === tabResource ? BLUE : "#6B7280", borderBottom: resource === tabResource ? `3px solid ${BLUE}` : "3px solid transparent", fontWeight: resource === tabResource ? 700 : 500 }}
                            >
                                {label}
                                <Chip size="small" label={counts[tabResource]} sx={{ ml: 1, height: 20, fontSize: 11, backgroundColor: resource === tabResource ? "#D4E3FF" : "#F3F4F6", color: resource === tabResource ? BLUE : "#6B7280" }} />
                            </Button>
                        ))}
                    </Stack>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
                        {error && <Box sx={{ mb: 2 }}><ErrorState message={error} onRetry={load} /></Box>}
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
                            <Box>
                                <Typography sx={{ color: "#1F2937", fontSize: 16, fontWeight: 700 }}>Tổng hợp {config.title}</Typography>
                                <Typography sx={{ color: "#6B7280", fontSize: 13 }}>Quản lý thông tin và trạng thái hoạt động</Typography>
                            </Box>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <TextField
                                    size="small"
                                    placeholder={`Tìm kiếm ${config.singular}...`}
                                    value={search}
                                    onChange={(event) => { setPage(0); setSearch(event.target.value); }}
                                    InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ color: "#6B7280", mr: 1 }} /> }}
                                />
                                <FormControl size="small" sx={{ minWidth: 170 }}>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select label="Trạng thái" value={active} onChange={(event) => { setPage(0); setActive(event.target.value); }}>
                                        <MenuItem value="">Tất cả</MenuItem>
                                        <MenuItem value="true">Đang hoạt động</MenuItem>
                                        <MenuItem value="false">Ngừng hoạt động</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Stack>
                        {loading ? <Loading /> : data.items?.length ? (
                            <>
                                <Box>
                                <Box sx={{ overflowX: "auto" }}>
                                    <Table sx={{ minWidth: resource === "rooms" ? 1040 : 720 }}>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                                                {config.columns.map((column) => <TableCell key={column} sx={{ color: "#6B7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{config.labels[column] || column}</TableCell>)}
                                                {resource !== "rooms" && <TableCell sx={{ color: "#6B7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Trạng thái</TableCell>}
                                                <TableCell align="center" sx={{ width: 220, color: "#6B7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.items.map((item) => (
                                                <TableRow
                                                    key={item[idField(resource)]}
                                                    hover
                                                    selected={selectedItem?.[idField(resource)] === item[idField(resource)]}
                                                    onClick={() => setSelectedItem(item)}
                                                    sx={{ cursor: "pointer", "&.Mui-selected": { backgroundColor: "#EFF6FF" } }}
                                                >
                                                    {config.columns.map((column) => <TableCell key={column} sx={{ color: "#374151", fontSize: 13, fontWeight: column === "code" || column === "roomNumber" ? 600 : 400 }}>{renderCell(item, column)}</TableCell>)}
                                                    {resource !== "rooms" && <TableCell><Chip size="small" label={item.isActive ? "Đang hoạt động" : "Ngừng hoạt động"} sx={{ color: item.isActive ? "#047857" : "#6B7280", backgroundColor: item.isActive ? "#ECFDF5" : "#F3F4F6", fontWeight: 600 }} /></TableCell>}
                                                    <TableCell align="center" sx={{ width: 220 }}>
                                                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                                            <Button size="small" onClick={(event) => { event.stopPropagation(); openDetail(item); }} sx={{ color: "#2563EB", fontWeight: 700 }}>Chi tiết</Button>
                                                            <Button size="small" onClick={(event) => { event.stopPropagation(); openEdit(item); }} sx={{ color: BLUE, fontWeight: 700 }}>Sửa</Button>
                                                            <Switch size="small" checked={item.isActive} onChange={() => toggle(item)} inputProps={{ "aria-label": `Đổi trạng thái ${config.singular}` }} />
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                                <TablePagination component="div" count={data.totalItems || 0} page={page} onPageChange={(_, value) => setPage(value)} rowsPerPage={10} rowsPerPageOptions={[10]} labelRowsPerPage="Số dòng" />
                                </Box>
                            </>
                        ) : <EmptyState message={`Chưa có ${config.singular} nào.`} />}
                    </Box>
                </Paper>
            </Stack>

            <Drawer anchor="right" open={drawerOpen} onClose={() => !saving && setDrawerOpen(false)}>
                <Box sx={{ width: { xs: "100vw", sm: 430 }, p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Box>
                            <Typography sx={{ color: "#1F2937", fontSize: 20, fontWeight: 700 }}>{editing ? `Sửa ${config.singular}` : `Thêm ${config.singular}`}</Typography>
                            <Typography sx={{ color: "#6B7280", fontSize: 13, mt: 0.5 }}>Cập nhật thông tin danh mục y tế</Typography>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} disabled={saving}><CloseIcon /></IconButton>
                    </Stack>
                    <Stack spacing={2}>
                        {config.fields.map((field) => field === "departmentId" ? (
                            <FormControl key={field} fullWidth required>
                                <InputLabel>Khoa</InputLabel>
                                <Select label="Khoa" value={form.departmentId || ""} onChange={(event) => setField("departmentId", event.target.value)}>
                                    {departments.map((department) => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <TextField key={field} label={config.labels[field]} value={form[field] || ""} onChange={(event) => setField(field, event.target.value)} required={!["description", "roomType", "location"].includes(field)} multiline={field === "description"} minRows={field === "description" ? 3 : undefined} fullWidth />
                        ))}
                        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 2 }}>
                            <Button onClick={() => setDrawerOpen(false)} disabled={saving}>Hủy</Button>
                            <Button variant="contained" onClick={save} disabled={saving} sx={{ backgroundColor: BLUE, "&:hover": { backgroundColor: "#1565C0" } }}>Lưu thay đổi</Button>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>
            <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)}>
                <Box sx={{ width: { xs: "100vw", sm: 430 }, p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Box>
                            <Typography sx={{ color: "#1F2937", fontSize: 20, fontWeight: 700 }}>Chi tiết {config.singular}</Typography>
                            <Typography sx={{ color: "#6B7280", fontSize: 13, mt: 0.5 }}>Thông tin hiện tại của danh mục</Typography>
                        </Box>
                        <IconButton onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
                    </Stack>
                    {selectedItem && <Stack spacing={2}>
                        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                            <Typography sx={{ color: BLUE, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Đang chọn</Typography>
                            <Typography sx={{ color: "#1F2937", fontSize: 19, fontWeight: 800, mt: .5 }}>{selectedItem.name}</Typography>
                            <Typography sx={{ color: "#6B7280", fontSize: 12 }}>{selectedItem.code || selectedItem.roomNumber || "Danh mục y tế"}</Typography>
                        </Box>
                        <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center"><CheckCircleOutlineOutlinedIcon sx={{ color: "#10B981", fontSize: 18 }} /><Typography fontSize={13}>{selectedItem.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}</Typography></Stack>
                            {selectedItem.departmentName && <Stack direction="row" spacing={1} alignItems="center"><PersonOutlineOutlinedIcon sx={{ color: "#6B7280", fontSize: 18 }} /><Typography fontSize={13}>{selectedItem.departmentName}</Typography></Stack>}
                            {(selectedItem.location || selectedItem.roomType) && <Stack direction="row" spacing={1} alignItems="center"><LocationOnOutlinedIcon sx={{ color: "#6B7280", fontSize: 18 }} /><Typography fontSize={13}>{selectedItem.location || selectedItem.roomType}</Typography></Stack>}
                        </Stack>
                        <Typography sx={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>{selectedItem.description || "Chưa có mô tả cho danh mục này."}</Typography>
                        <Button fullWidth variant="contained" onClick={() => { setDetailOpen(false); openEdit(selectedItem); }} sx={{ backgroundColor: BLUE, "&:hover": { backgroundColor: "#1565C0" } }}>Chỉnh sửa thông tin</Button>
                    </Stack>}
                </Box>
            </Drawer>
        </Box>
    );
}

export default CatalogManagementPage;
