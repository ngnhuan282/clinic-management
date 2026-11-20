import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Drawer,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
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
import {
    CheckCircleRounded,
    CloseRounded,
    DomainRounded,
    DownloadRounded,
    LocationOnRounded,
    MedicalInformationRounded,
    MedicalServicesRounded,
    MeetingRoomRounded,
    WorkOutlineRounded,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

import catalogApi from "../../api/catalogApi";
import ClinicPageHeader, {
    AdminStatCard,
    ClinicPagination,
} from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import {
    AdminAddIcon,
    AdminEditIcon,
    AdminFilterIcon,
    AdminRefreshIcon,
    AdminResetIcon,
    AdminSearchIcon,
    AdminViewIcon,
    adminEditIconButtonSx,
    adminFilterCardSx,
    adminViewIconButtonSx,
    clinicColors,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
    clinicTableSx,
    clinicToast,
} from "../../components/common/clinicUi";
import getApiErrorMessage from "../../utils/errorHandler";

const CONFIG = {
    departments: {
        title: "Khoa phòng",
        singular: "khoa",
        tab: "Khoa phòng",
        icon: DomainRounded,
        fields: ["code", "name", "description"],
        labels: { code: "Mã khoa", name: "Tên khoa", description: "Mô tả" },
        columns: ["code", "name", "description"],
    },
    specializations: {
        title: "Chuyên khoa",
        singular: "chuyên khoa",
        tab: "Chuyên khoa",
        icon: MedicalInformationRounded,
        fields: ["code", "name", "description", "departmentId"],
        labels: {
            code: "Mã chuyên khoa",
            name: "Tên chuyên khoa",
            description: "Mô tả",
            departmentId: "Khoa phụ trách",
            departmentName: "Khoa phụ trách",
        },
        columns: ["code", "name", "departmentName", "description"],
    },
    rooms: {
        title: "Buồng khám",
        singular: "phòng",
        tab: "Buồng khám",
        icon: MeetingRoomRounded,
        fields: ["roomNumber", "name", "roomType", "departmentId", "location"],
        labels: {
            roomSummary: "Số & tên buồng khám",
            roomType: "Loại phòng",
            departmentName: "Khoa phụ trách",
            location: "Vị trí",
            roomNumber: "Số phòng",
            name: "Tên phòng",
            departmentId: "Khoa phụ trách",
        },
        columns: ["roomSummary", "roomType", "departmentName", "location"],
    },
    "job-positions": {
        title: "Vị trí công việc",
        singular: "vị trí công việc",
        tab: "Vị trí công việc",
        icon: WorkOutlineRounded,
        fields: ["code", "name", "description"],
        labels: { code: "Mã vị trí", name: "Tên vị trí", description: "Mô tả" },
        columns: ["code", "name", "description"],
    },
};

const TABS = [
    { resource: "departments", label: "Khoa phòng", icon: DomainRounded },
    { resource: "specializations", label: "Chuyên khoa", icon: MedicalInformationRounded },
    { resource: "rooms", label: "Buồng khám", icon: MeetingRoomRounded },
    { resource: "job-positions", label: "Vị trí công việc", icon: WorkOutlineRounded },
];

const empty = (resource) =>
    resource === "rooms"
        ? { roomNumber: "", name: "", roomType: "", departmentId: "", location: "" }
        : resource === "specializations"
          ? { code: "", name: "", description: "", departmentId: "" }
          : { code: "", name: "", description: "" };

const idField = (resource) =>
    resource === "departments"
        ? "departmentId"
        : resource === "specializations"
          ? "specializationId"
          : resource === "job-positions"
            ? "jobPositionId"
            : "roomId";

function escapeCsv(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function CatalogManagementPage({ resource }) {
    const config = CONFIG[resource];
    const [data, setData] = useState({ items: [], totalItems: 0 });
    const [counts, setCounts] = useState({ departments: 0, specializations: 0, rooms: 0, "job-positions": 0 });
    const [departments, setDepartments] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [active, setActive] = useState("");
    const [form, setForm] = useState(() => empty(resource));
    const [editing, setEditing] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerError, setDrawerError] = useState("");
    const [detailOpen, setDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const loadSummary = useCallback(async () => {
        try {
            const resources = Object.keys(CONFIG);
            const responses = await Promise.all(
                resources.map((name) =>
                    catalogApi.list(name, { pageNumber: 1, pageSize: 1, isActive: true })
                )
            );
            setCounts(
                Object.fromEntries(
                    resources.map((name, index) => [
                        name,
                        responses[index].data.result?.totalItems || 0,
                    ])
                )
            );
        } catch {
            // Keep existing summary counts if background refresh fails.
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await catalogApi.list(resource, {
                pageNumber,
                pageSize,
                search: search.trim() || undefined,
                isActive: active === "" ? undefined : active === "true",
            });
            const result = response.data.result || { items: [], totalItems: 0 };
            setData(result);
            setSelectedItem((current) => current || result.items?.[0] || null);
        } catch (err) {
            setError(getApiErrorMessage(err, "Không thể tải dữ liệu danh mục."));
        } finally {
            setLoading(false);
        }
    }, [resource, pageNumber, pageSize, search, active]);

    useEffect(() => {
        setPageNumber(1);
        setSelectedItem(null);
        setDrawerOpen(false);
        setDetailOpen(false);
    }, [resource]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        void loadSummary();
        if (resource === "specializations" || resource === "rooms") {
            catalogApi
                .list("departments", { pageNumber: 1, pageSize: 100, isActive: true })
                .then((response) => setDepartments(response.data.result?.items || []))
                .catch(() => setDepartments([]));
        }
    }, [resource, loadSummary]);

    const resetFilters = () => {
        setSearch("");
        setActive("");
        setPageNumber(1);
    };

    const exportCsv = () => {
        if (!data.items?.length) return;
        const headers =
            resource === "rooms"
                ? ["Số phòng", "Tên phòng", "Loại phòng", "Khoa phụ trách", "Vị trí", "Trạng thái"]
                : resource === "specializations"
                  ? ["Mã chuyên khoa", "Tên chuyên khoa", "Khoa phụ trách", "Mô tả", "Trạng thái"]
                  : resource === "job-positions"
                    ? ["Mã vị trí", "Tên vị trí", "Mô tả", "Trạng thái"]
                    : ["Mã khoa", "Tên khoa", "Mô tả", "Trạng thái"];

        const rows = data.items.map((item) =>
            resource === "rooms"
                ? [
                      item.roomNumber,
                      item.name,
                      item.roomType || "",
                      item.departmentName || "",
                      item.location || "",
                      item.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
                  ]
                : resource === "specializations"
                  ? [
                        item.code,
                        item.name,
                        item.departmentName || "",
                        item.description || "",
                        item.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
                    ]
                  : [
                        item.code,
                        item.name,
                        item.description || "",
                        item.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
                    ]
        );

        const csvContent =
            "\uFEFF" +
            [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
        const url = URL.createObjectURL(
            new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `danh-muc-${resource}-trang-${pageNumber}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        clinicToast.success(`Đã xuất danh mục ${config.title.toLowerCase()} ra tệp CSV.`);
    };

    const openCreate = () => {
        setEditing(null);
        setDrawerError("");
        setForm(empty(resource));
        setDrawerOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setDrawerError("");
        setForm(
            resource === "rooms"
                ? {
                      roomNumber: item.roomNumber || "",
                      name: item.name || "",
                      roomType: item.roomType || "",
                      departmentId: item.departmentId || "",
                      location: item.location || "",
                      isActive: item.isActive,
                  }
                : {
                      code: item.code || "",
                      name: item.name || "",
                      description: item.description || "",
                      departmentId: item.departmentId || "",
                      isActive: item.isActive,
                  }
        );
        setDrawerOpen(true);
    };

    const openDetail = (item) => {
        setSelectedItem(item);
        setDetailOpen(true);
    };

    const validateForm = () => {
        if (resource === "rooms") {
            if (!String(form.roomNumber || "").trim()) return "Vui lòng nhập số phòng.";
            if (!String(form.name || "").trim()) return "Vui lòng nhập tên phòng.";
            if (!form.departmentId) return "Vui lòng chọn khoa phụ trách.";
            return "";
        }
        if (!String(form.code || "").trim()) return `Vui lòng nhập mã ${config.singular}.`;
        if (!String(form.name || "").trim()) return `Vui lòng nhập tên ${config.singular}.`;
        if (resource === "specializations" && !form.departmentId) {
            return "Vui lòng chọn khoa phụ trách.";
        }
        return "";
    };

    const save = async (event) => {
        event?.preventDefault();
        const validationMessage = validateForm();
        if (validationMessage) {
            setDrawerError(validationMessage);
            clinicToast.error(validationMessage);
            return;
        }

        setSaving(true);
        setDrawerError("");
        try {
            const payload =
                resource === "rooms"
                    ? {
                          roomNumber: form.roomNumber.trim(),
                          name: form.name.trim(),
                          roomType: form.roomType?.trim() || null,
                          departmentId: Number(form.departmentId),
                          location: form.location?.trim() || null,
                          ...(editing ? { isActive: Boolean(form.isActive) } : {}),
                      }
                    : resource === "specializations"
                      ? {
                            code: form.code.trim(),
                            name: form.name.trim(),
                            description: form.description?.trim() || null,
                            departmentId: Number(form.departmentId),
                            ...(editing ? { isActive: Boolean(form.isActive) } : {}),
                        }
                      : {
                            code: form.code.trim(),
                            name: form.name.trim(),
                            description: form.description?.trim() || null,
                            ...(editing ? { isActive: Boolean(form.isActive) } : {}),
                        };

            if (editing) {
                await catalogApi.update(resource, editing[idField(resource)], payload);
            } else {
                await catalogApi.create(resource, payload);
            }

            setDrawerOpen(false);
            clinicToast.success(
                editing
                    ? `Đã cập nhật ${config.singular} thành công.`
                    : `Đã thêm ${config.singular} mới thành công.`
            );
            await Promise.all([load(), loadSummary()]);
        } catch (err) {
            const message = getApiErrorMessage(err, `Không thể lưu ${config.singular}.`);
            setDrawerError(message);
            clinicToast.error(message);
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
                    : currentItem
            ),
        }));
        setCounts((current) => ({
            ...current,
            [resource]: Math.max(0, current[resource] + countDelta),
        }));
        setSelectedItem((current) =>
            current?.[idField(resource)] === itemId
                ? { ...current, isActive: nextActive }
                : current
        );

        try {
            await catalogApi.updateStatus(resource, itemId, nextActive);
            clinicToast.success(
                nextActive
                    ? `Đã kích hoạt lại ${config.singular}.`
                    : `Đã tạm ngưng ${config.singular}.`
            );
        } catch (err) {
            setData((current) => ({
                ...current,
                items: current.items.map((currentItem) =>
                    currentItem[idField(resource)] === itemId
                        ? { ...currentItem, isActive: item.isActive }
                        : currentItem
                ),
            }));
            setCounts((current) => ({
                ...current,
                [resource]: Math.max(0, current[resource] - countDelta),
            }));
            setSelectedItem((current) =>
                current?.[idField(resource)] === itemId
                    ? { ...current, isActive: item.isActive }
                    : current
            );
            clinicToast.error(
                getApiErrorMessage(err, "Không thể cập nhật trạng thái danh mục.")
            );
        }
    };

    const setField = (name, value) => {
        setDrawerError("");
        setForm((current) => ({ ...current, [name]: value }));
    };

    const renderCell = (item, column) => {
        if (resource !== "rooms") {
            if (column === "code") {
                return (
                    <Typography sx={{ color: clinicColors.primary, fontSize: 13.5, fontWeight: 750 }}>
                        {item.code}
                    </Typography>
                );
            }
            if (column === "name") {
                return (
                    <Typography sx={{ color: clinicColors.heading, fontSize: 14, fontWeight: 700 }}>
                        {item.name}
                    </Typography>
                );
            }
            if (column === "departmentName") {
                return (
                    <Chip
                        size="small"
                        label={item.departmentName || "Chưa gán khoa"}
                        sx={{
                            bgcolor: "#E8F2FC",
                            color: clinicColors.primary,
                            fontWeight: 650,
                            borderRadius: "8px",
                        }}
                    />
                );
            }
            return (
                <Typography sx={{ color: "#475569", fontSize: 13.5 }}>
                    {item[column] || "—"}
                </Typography>
            );
        }

        if (column === "roomSummary") {
            return (
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                    <Box
                        sx={{
                            width: 4,
                            height: 30,
                            borderRadius: 99,
                            bgcolor: item.isActive ? "#059669" : "#CBD5E1",
                            flexShrink: 0,
                        }}
                    />
                    <Box>
                        <Typography sx={{ color: clinicColors.heading, fontSize: 14, fontWeight: 750 }}>
                            {item.roomNumber} — {item.name}
                        </Typography>
                        <Typography sx={{ color: "#64748B", fontSize: 12 }}>
                            Mã phòng: #{item.roomId}
                        </Typography>
                    </Box>
                </Stack>
            );
        }
        if (column === "roomType") {
            return (
                <Typography sx={{ color: "#334155", fontSize: 13.5, fontWeight: 600 }}>
                    {item.roomType || "Phòng khám"}
                </Typography>
            );
        }
        if (column === "departmentName") {
            return (
                <Chip
                    size="small"
                    label={item.departmentName || "Chưa gán khoa"}
                    sx={{
                        bgcolor: "#E8F2FC",
                        color: clinicColors.primary,
                        fontWeight: 650,
                        borderRadius: "8px",
                    }}
                />
            );
        }
        return (
            <Typography sx={{ color: "#475569", fontSize: 13.5 }}>
                {item.location || "Chưa cập nhật"}
            </Typography>
        );
    };

    return (
        <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                eyebrow={`Danh mục y tế · ${config.tab}`}
                title={resource === "job-positions" ? "Quản lý Vị trí công việc" : "Quản lý Khoa phòng, Chuyên khoa & Buồng khám"}
                description={resource === "job-positions"
                    ? "Thiết lập danh mục vị trí công việc để gán cho hồ sơ nhân viên lễ tân, thu ngân, dược sĩ và kỹ thuật viên xét nghiệm."
                    : "Thiết lập cấu trúc chuyên môn, phân bổ chuyên khoa và buồng khám đồng bộ cho đặt lịch & tiếp đón."}
                icon={config.icon}
                actions={
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadRounded />}
                            onClick={exportCsv}
                            disabled={!data.items?.length}
                            sx={clinicSecondaryButtonSx}
                        >
                            Xuất danh mục
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AdminAddIcon />}
                            onClick={openCreate}
                            sx={clinicPrimaryButtonSx}
                        >
                            Thêm {config.singular}
                        </Button>
                    </>
                }
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                    gap: 2.25,
                }}
            >
                <AdminStatCard
                    title="Khoa chuyên môn đang mở"
                    value={counts.departments}
                    subtitle="Khoa lâm sàng & cận lâm sàng hoạt động"
                    icon={DomainRounded}
                    tone="blue"
                />
                <AdminStatCard
                    title="Chuyên khoa hoạt động"
                    value={counts.specializations}
                    subtitle="Phục vụ đặt lịch khám theo chuyên khoa"
                    icon={MedicalInformationRounded}
                    tone="sky"
                />
                <AdminStatCard
                    title="Buồng khám sẵn sàng"
                    value={counts.rooms}
                    subtitle="Đang mở đón tiếp người bệnh"
                    icon={MeetingRoomRounded}
                    tone="emerald"
                />
                <AdminStatCard
                    title={`Tổng ${config.title.toLowerCase()} theo lọc`}
                    value={data.totalItems || 0}
                    subtitle="Số bản ghi khớp điều kiện hiện tại"
                    icon={MedicalServicesRounded}
                    tone="purple"
                />
            </Box>

            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        px: { xs: 2, md: 3 },
                        pt: 1.5,
                        borderBottom: "1px solid #E4ECF5",
                        overflowX: "auto",
                        bgcolor: "#FAFCFF",
                    }}
                >
                    {TABS.map(({ resource: tabResource, label, icon: Icon }) => {
                        const selected = resource === tabResource;
                        return (
                            <Button
                                key={tabResource}
                                component={RouterLink}
                                to={`/internal/${tabResource}`}
                                startIcon={<Icon sx={{ fontSize: 19 }} />}
                                sx={{
                                    flexShrink: 0,
                                    borderRadius: "10px 10px 0 0",
                                    minHeight: 48,
                                    px: 2,
                                    textTransform: "none",
                                    fontSize: 14,
                                    color: selected ? clinicColors.primary : "#475569",
                                    borderBottom: selected
                                        ? `3px solid ${clinicColors.primary}`
                                        : "3px solid transparent",
                                    fontWeight: selected ? 750 : 600,
                                    "&:hover": { bgcolor: "#EFF6FC" },
                                }}
                            >
                                {label}
                                <Chip
                                    size="small"
                                    label={counts[tabResource]}
                                    sx={{
                                        ml: 1,
                                        height: 21,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        bgcolor: selected ? "#DBEAFE" : "#EDF2F7",
                                        color: selected ? clinicColors.primary : "#475569",
                                    }}
                                />
                            </Button>
                        );
                    })}
                </Stack>

                <Box sx={{ p: { xs: 2, md: 2.75 }, borderBottom: "1px solid #E8EFF6" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                        <AdminFilterIcon sx={{ fontSize: 19, color: clinicColors.primary }} />
                        <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>
                            Bộ lọc {config.title.toLowerCase()}
                        </Typography>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={`Tìm kiếm ${config.singular}`}
                            placeholder={`Nhập mã, tên hoặc thông tin ${config.singular}...`}
                            value={search}
                            onChange={(event) => {
                                setPageNumber(1);
                                setSearch(event.target.value);
                            }}
                            sx={{ ...clinicFieldSx, flex: 1.6 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AdminSearchIcon sx={{ color: "#64748B", fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            select
                            size="small"
                            label="Trạng thái"
                            value={active}
                            onChange={(event) => {
                                setPageNumber(1);
                                setActive(event.target.value);
                            }}
                            sx={{ ...clinicFieldSx, minWidth: { xs: "100%", md: 200 } }}
                        >
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="true">Đang hoạt động</MenuItem>
                            <MenuItem value="false">Ngừng hoạt động</MenuItem>
                        </TextField>

                        <Button
                            variant="outlined"
                            startIcon={<AdminResetIcon />}
                            onClick={resetFilters}
                            sx={{ ...clinicResetButtonSx, whiteSpace: "nowrap" }}
                        >
                            Đặt lại bộ lọc
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<AdminRefreshIcon />}
                            onClick={load}
                            disabled={loading}
                            sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}
                        >
                            Làm mới dữ liệu
                        </Button>
                    </Stack>
                </Box>

                {error ? (
                    <Box sx={{ p: 3 }}>
                        <ErrorState message={error} onRetry={load} />
                    </Box>
                ) : loading ? (
                    <Loading />
                ) : data.items?.length ? (
                    <>
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ ...clinicTableSx, minWidth: 780 }}>
                                <TableHead>
                                    <TableRow>
                                        {config.columns.map((column) => (
                                            <TableCell key={column}>
                                                {config.labels[column] || column}
                                            </TableCell>
                                        ))}
                                        <TableCell>Trạng thái</TableCell>
                                        <TableCell align="right" sx={{ width: 170 }}>
                                            Thao tác
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data.items.map((item) => {
                                        const itemId = item[idField(resource)];
                                        return (
                                            <TableRow
                                                key={itemId}
                                                hover
                                                selected={selectedItem?.[idField(resource)] === itemId}
                                                onClick={() => setSelectedItem(item)}
                                                sx={{
                                                    cursor: "pointer",
                                                    "&.Mui-selected": { bgcolor: "#EFF6FC" },
                                                }}
                                            >
                                                {config.columns.map((column) => (
                                                    <TableCell key={column}>
                                                        {renderCell(item, column)}
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            item.isActive
                                                                ? "Đang hoạt động"
                                                                : "Ngừng hoạt động"
                                                        }
                                                        sx={{
                                                            color: item.isActive ? "#065F46" : "#475569",
                                                            bgcolor: item.isActive ? "#DCFCE7" : "#F1F5F9",
                                                            border: `1px solid ${item.isActive ? "#86EFAC" : "#CBD5E1"}`,
                                                            fontWeight: 650,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.75}
                                                        sx={{ justifyContent: "flex-end", alignItems: "center" }}
                                                    >
                                                        <Tooltip title={`Xem chi tiết ${config.singular}`}>
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`Xem ${item.name}`}
                                                                onClick={() => openDetail(item)}
                                                                sx={adminViewIconButtonSx}
                                                            >
                                                                <AdminViewIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={`Sửa ${config.singular}`}>
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`Sửa ${item.name}`}
                                                                onClick={() => openEdit(item)}
                                                                sx={adminEditIconButtonSx}
                                                            >
                                                                <AdminEditIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={
                                                                item.isActive
                                                                    ? "Tạm ngưng sử dụng"
                                                                    : "Kích hoạt sử dụng"
                                                            }
                                                        >
                                                            <Switch
                                                                size="small"
                                                                color="primary"
                                                                checked={Boolean(item.isActive)}
                                                                onChange={() => toggle(item)}
                                                                inputProps={{
                                                                    "aria-label": `Đổi trạng thái ${config.singular}`,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <ClinicPagination
                            page={pageNumber}
                            pageSize={pageSize}
                            totalItems={data.totalItems || 0}
                            label={config.singular}
                            disabled={loading}
                            onPageChange={setPageNumber}
                            onPageSizeChange={(nextSize) => {
                                setPageSize(nextSize);
                                setPageNumber(1);
                            }}
                        />
                    </>
                ) : (
                    <EmptyState message={`Chưa có ${config.singular} phù hợp với bộ lọc.`} />
                )}
            </Paper>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => !saving && setDrawerOpen(false)}
            >
                <Box
                    component="form"
                    onSubmit={save}
                    noValidate
                    sx={{ width: { xs: "100vw", sm: 440 }, p: 3 }}
                >
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Box>
                            <Typography sx={{ color: clinicColors.heading, fontSize: 20, fontWeight: 800 }}>
                                {editing ? `Cập nhật ${config.singular}` : `Thêm ${config.singular} mới`}
                            </Typography>
                            <Typography sx={{ color: clinicColors.muted, fontSize: 13.5, mt: 0.4 }}>
                                Các trường có dấu * là thông tin bắt buộc.
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} disabled={saving}>
                            <CloseRounded />
                        </IconButton>
                    </Stack>

                    <Stack spacing={2.25}>
                        {drawerError && <Alert severity="error">{drawerError}</Alert>}

                        {config.fields.map((field) =>
                            field === "departmentId" ? (
                                <FormControl key={field} fullWidth required sx={clinicFieldSx}>
                                    <InputLabel>Khoa phụ trách</InputLabel>
                                    <Select
                                        label="Khoa phụ trách"
                                        value={form.departmentId || ""}
                                        onChange={(event) => setField("departmentId", event.target.value)}
                                    >
                                        {departments.map((department) => (
                                            <MenuItem
                                                key={department.departmentId}
                                                value={department.departmentId}
                                            >
                                                {department.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <TextField
                                    key={field}
                                    label={config.labels[field]}
                                    value={form[field] || ""}
                                    onChange={(event) => setField(field, event.target.value)}
                                    required={!["description", "roomType", "location"].includes(field)}
                                    multiline={field === "description"}
                                    minRows={field === "description" ? 3 : undefined}
                                    fullWidth
                                    sx={clinicFieldSx}
                                />
                            )
                        )}

                        <Stack direction="row" spacing={1.25} sx={{ justifyContent: "flex-end", pt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setDrawerOpen(false)}
                                disabled={saving}
                                sx={clinicSecondaryButtonSx}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                sx={clinicPrimaryButtonSx}
                            >
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>

            <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)}>
                <Box sx={{ width: { xs: "100vw", sm: 440 }, p: 3 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Box>
                            <Typography sx={{ color: clinicColors.heading, fontSize: 20, fontWeight: 800 }}>
                                Chi tiết {config.singular}
                            </Typography>
                            <Typography sx={{ color: clinicColors.muted, fontSize: 13.5, mt: 0.4 }}>
                                Thông tin cấu hình hiện tại trong hệ thống
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setDetailOpen(false)}>
                            <CloseRounded />
                        </IconButton>
                    </Stack>

                    {selectedItem && (
                        <Stack spacing={2.25}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    ...adminFilterCardSx,
                                    bgcolor: "#E8F2FC",
                                    borderColor: "#BFDBFE",
                                    boxShadow: "none",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: clinicColors.primary,
                                        fontSize: 11.5,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {config.tab}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: clinicColors.heading,
                                        fontSize: 19,
                                        fontWeight: 800,
                                        mt: 0.5,
                                    }}
                                >
                                    {selectedItem.name}
                                </Typography>
                                <Typography sx={{ color: "#475569", fontSize: 13, mt: 0.25 }}>
                                    Mã: {selectedItem.code || selectedItem.roomNumber || `#${selectedItem[idField(resource)]}`}
                                </Typography>
                            </Paper>

                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <CheckCircleRounded
                                        sx={{
                                            color: selectedItem.isActive ? "#059669" : "#64748B",
                                            fontSize: 19,
                                        }}
                                    />
                                    <Typography sx={{ fontSize: 14, fontWeight: 650 }}>
                                        {selectedItem.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                                    </Typography>
                                </Stack>

                                {selectedItem.departmentName && (
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <DomainRounded sx={{ color: clinicColors.primary, fontSize: 19 }} />
                                        <Typography sx={{ fontSize: 14 }}>
                                            Khoa phụ trách: <strong>{selectedItem.departmentName}</strong>
                                        </Typography>
                                    </Stack>
                                )}

                                {(selectedItem.location || selectedItem.roomType) && (
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <LocationOnRounded sx={{ color: "#0284C7", fontSize: 19 }} />
                                        <Typography sx={{ fontSize: 14 }}>
                                            {[selectedItem.roomType, selectedItem.location]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </Typography>
                                    </Stack>
                                )}
                            </Stack>

                            <Typography sx={{ color: "#475569", fontSize: 14, lineHeight: 1.65 }}>
                                {selectedItem.description || "Chưa có mô tả chi tiết cho mục này."}
                            </Typography>

                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<AdminEditIcon />}
                                onClick={() => {
                                    setDetailOpen(false);
                                    openEdit(selectedItem);
                                }}
                                sx={clinicPrimaryButtonSx}
                            >
                                Chỉnh sửa thông tin
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Drawer>
        </Stack>
    );
}

export default CatalogManagementPage;
