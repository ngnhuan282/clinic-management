import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
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
    PauseCircleOutlineRounded,
    ScienceRounded,
} from "@mui/icons-material";

import { labTestTypeApi } from "../../api/labTestTypeApi";
import ClinicPageHeader, {
    AdminStatCard,
    ClinicPagination,
} from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
    AdminAddIcon,
    AdminDeleteIcon,
    AdminEditIcon,
    AdminFilterIcon,
    AdminRefreshIcon,
    AdminResetIcon,
    AdminSearchIcon,
    adminDeleteIconButtonSx,
    adminEditIconButtonSx,
    adminFilterCardSx,
    clinicButtonSx,
    clinicColors,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicDialogTitleSx,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
    clinicTableSx,
    clinicToast,
} from "../../components/common/clinicUi";
import useAuth from "../../hooks/useAuth";
import getApiErrorMessage from "../../utils/errorHandler";
import LabTestTypeModal from "./LabTestTypeModal";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function LabTestTypesPage() {
    const { role, permissions } = useAuth();
    const canEdit = role === "Admin" && permissions.includes("labs.manageTypes");
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [hideTarget, setHideTarget] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const listRequest = useRef(0);
    const invalidateList = useCallback(() => {
        listRequest.current++;
    }, []);

    const fetchList = useCallback(async () => {
        const requestId = ++listRequest.current;
        setLoading(true);
        setError("");
        try {
            const response = await labTestTypeApi.getAll(true);
            const rawData =
                response?.data?.result ||
                response?.data?.data ||
                response?.data?.items ||
                response?.data;
            if (requestId === listRequest.current) {
                setList(Array.isArray(rawData) ? rawData : []);
            }
        } catch (requestError) {
            if (requestId === listRequest.current) {
                setError(getApiErrorMessage(requestError));
                setList([]);
            }
        } finally {
            if (requestId === listRequest.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchList();
        }, 0);
        return () => {
            clearTimeout(timer);
            invalidateList();
        };
    }, [fetchList, invalidateList]);

    const filtered = useMemo(
        () =>
            list.filter((item) => {
                const query = search.trim().toLocaleLowerCase("vi");
                return (
                    (!query ||
                        `${item.id} ${item.name} ${item.description || ""}`
                            .toLocaleLowerCase("vi")
                            .includes(query)) &&
                    (!status || item.isActive === (status === "active"))
                );
            }),
        [list, search, status]
    );

    const activeCount = useMemo(() => list.filter((item) => item.isActive).length, [list]);
    const inactiveCount = list.length - activeCount;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(pageNumber, totalPages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const reset = () => {
        setSearch("");
        setStatus("");
        setPageNumber(1);
    };

    const openForm = (item) => {
        setSelectedItem(item);
        setActionError("");
        setIsModalOpen(true);
    };

    const submit = async (data) => {
        if (saving || !canEdit) return;
        setSaving(true);
        setActionError("");
        try {
            if (selectedItem) await labTestTypeApi.update(selectedItem.id, data);
            else await labTestTypeApi.create(data);
            setIsModalOpen(false);
            clinicToast.success(
                selectedItem
                    ? "Đã cập nhật loại xét nghiệm thành công."
                    : "Đã thêm loại xét nghiệm mới thành công."
            );
            await fetchList();
        } catch (requestError) {
            const msg = getApiErrorMessage(requestError);
            setActionError(msg);
            clinicToast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const hide = async () => {
        if (saving || !hideTarget || !canEdit) return;
        setSaving(true);
        setActionError("");
        try {
            await labTestTypeApi.delete(hideTarget.id);
            setHideTarget(null);
            clinicToast.success("Đã ngừng sử dụng loại xét nghiệm.");
            await fetchList();
        } catch (requestError) {
            const msg = getApiErrorMessage(requestError);
            setActionError(msg);
            clinicToast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                title="Danh mục xét nghiệm"
                icon={ScienceRounded}
                description="Thông tin dịch vụ, đơn giá và trạng thái sử dụng của các loại xét nghiệm cận lâm sàng."
                actions={
                    canEdit && (
                        <Button
                            variant="contained"
                            startIcon={<AdminAddIcon />}
                            onClick={() => openForm(null)}
                            sx={clinicPrimaryButtonSx}
                        >
                            Thêm loại xét nghiệm
                        </Button>
                    )
                }
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 2.25,
                }}
            >
                <AdminStatCard
                    title="Tổng dịch vụ xét nghiệm"
                    value={list.length}
                    subtitle="Toàn bộ danh mục trong hệ thống"
                    icon={ScienceRounded}
                    tone="blue"
                    loading={loading}
                />
                <AdminStatCard
                    title="Đang triển khai"
                    value={activeCount}
                    subtitle="Bác sĩ có thể chỉ định cho bệnh nhân"
                    icon={CheckCircleRounded}
                    tone="emerald"
                    loading={loading}
                />
                <AdminStatCard
                    title="Ngừng sử dụng"
                    value={inactiveCount}
                    subtitle="Giữ lịch sử hồ sơ cũ, ẩn khi chỉ định mới"
                    icon={PauseCircleOutlineRounded}
                    tone="amber"
                    loading={loading}
                />
            </Box>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" onClick={fetchList}>
                            Thử lại
                        </Button>
                    }
                    sx={{ borderRadius: "12px" }}
                >
                    {error}
                </Alert>
            )}

            <Paper variant="outlined" sx={adminFilterCardSx}>
                <Stack direction="row" spacing={1} sx={{ mb: 1.75, alignItems: "center" }}>
                    <AdminFilterIcon sx={{ color: clinicColors.primary, fontSize: 19 }} />
                    <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>
                        Bộ lọc danh mục xét nghiệm
                    </Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Tìm loại xét nghiệm"
                        placeholder="Tên, mô tả hoặc mã xét nghiệm"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPageNumber(1);
                        }}
                        sx={{ ...clinicFieldSx, flex: 1.5 }}
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
                        fullWidth
                        size="small"
                        label="Trạng thái"
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPageNumber(1);
                        }}
                        sx={{ ...clinicFieldSx, flex: 1 }}
                    >
                        <MenuItem value="">Tất cả trạng thái</MenuItem>
                        <MenuItem value="active">Đang sử dụng</MenuItem>
                        <MenuItem value="inactive">Ngừng sử dụng</MenuItem>
                    </TextField>
                    <Button
                        variant="outlined"
                        onClick={reset}
                        startIcon={<AdminResetIcon />}
                        sx={{ ...clinicResetButtonSx, whiteSpace: "nowrap" }}
                    >
                        Đặt lại bộ lọc
                    </Button>
                    <Button
                        variant="outlined"
                        disabled={loading}
                        onClick={fetchList}
                        startIcon={<AdminRefreshIcon />}
                        sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}
                    >
                        Làm mới dữ liệu
                    </Button>
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{ p: 2.5, alignItems: "center", borderBottom: "1px solid #E4ECF5" }}
                >
                    <Typography sx={{ fontWeight: 750, color: clinicColors.heading }}>
                        Các loại xét nghiệm
                    </Typography>
                    {!loading && (
                        <Chip
                            size="small"
                            label={`${filtered.length} loại`}
                            sx={{ bgcolor: "#E8F2FC", color: clinicColors.primary, fontWeight: 700 }}
                        />
                    )}
                </Stack>
                {loading && <LinearProgress />}
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table aria-label="Danh mục xét nghiệm" sx={{ ...clinicTableSx, minWidth: 780 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Mã</TableCell>
                                <TableCell>Tên xét nghiệm / mô tả</TableCell>
                                <TableCell align="right">Đơn giá</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                {canEdit && <TableCell align="right">Thao tác</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }, (_, index) => (
                                    <TableRow key={index}>
                                        {Array.from({ length: canEdit ? 5 : 4 }, (_, cell) => (
                                            <TableCell key={cell}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : visible.length ? (
                                visible.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ color: clinicColors.primary, fontWeight: 700 }}>
                                            #{item.id}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 440 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: clinicColors.heading,
                                                }}
                                            >
                                                {item.name}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    mt: 0.4,
                                                    color: clinicColors.muted,
                                                    fontSize: 13,
                                                    whiteSpace: "pre-wrap",
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {item.description || "Chưa có mô tả"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 750,
                                                whiteSpace: "nowrap",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {formatCurrency(item.price)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={item.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                                                sx={{
                                                    bgcolor: item.isActive ? "#DCFCE7" : "#F1F5F9",
                                                    color: item.isActive ? "#065F46" : "#475569",
                                                    border: `1px solid ${item.isActive ? "#86EFAC" : "#CBD5E1"}`,
                                                    fontWeight: 650,
                                                }}
                                            />
                                        </TableCell>
                                        {canEdit && (
                                            <TableCell align="right">
                                                <Stack
                                                    direction="row"
                                                    spacing={0.75}
                                                    sx={{ justifyContent: "flex-end" }}
                                                >
                                                    <Tooltip title="Sửa loại xét nghiệm">
                                                        <IconButton
                                                            size="small"
                                                            aria-label={`Sửa ${item.name}`}
                                                            onClick={() => openForm(item)}
                                                            sx={adminEditIconButtonSx}
                                                        >
                                                            <AdminEditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {item.isActive && (
                                                        <Tooltip title="Ngừng sử dụng">
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`Ngừng sử dụng ${item.name}`}
                                                                onClick={() => {
                                                                    setActionError("");
                                                                    setHideTarget(item);
                                                                }}
                                                                sx={adminDeleteIconButtonSx}
                                                            >
                                                                <AdminDeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 5 : 4}>
                                        <EmptyState
                                            message={
                                                error
                                                    ? "Chưa tải được danh mục xét nghiệm."
                                                    : "Không có loại xét nghiệm phù hợp."
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <ClinicPagination
                    page={currentPage}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    label="loại xét nghiệm"
                    disabled={loading}
                    onPageChange={setPageNumber}
                    onPageSizeChange={(nextSize) => {
                        setPageSize(nextSize);
                        setPageNumber(1);
                    }}
                />
            </Paper>

            <LabTestTypeModal
                key={`${isModalOpen}-${selectedItem?.id ?? "new"}`}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={submit}
                initialData={selectedItem}
                saving={saving}
                error={actionError}
            />

            <Dialog
                open={Boolean(hideTarget)}
                onClose={saving ? undefined : () => setHideTarget(null)}
                maxWidth="xs"
                fullWidth
                aria-labelledby="hide-lab-title"
                slotProps={{ paper: { sx: clinicDialogPaperSx } }}
            >
                <DialogTitle id="hide-lab-title" sx={clinicDialogTitleSx}>
                    Ngừng sử dụng xét nghiệm
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 2.5 }}>
                    <Stack spacing={2}>
                        {actionError && <Alert severity="error">{actionError}</Alert>}
                        <Typography sx={{ fontSize: 14.5, lineHeight: 1.7 }}>
                            Ngừng sử dụng “{hideTarget?.name}”? Loại xét nghiệm vẫn được lưu trong danh mục. Bạn có thể bật lại trạng thái khi sửa thông tin.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={clinicDialogActionsSx}>
                    <Button
                        variant="outlined"
                        disabled={saving}
                        onClick={() => setHideTarget(null)}
                        sx={clinicSecondaryButtonSx}
                    >
                        Hủy
                    </Button>
                    <Button
                        disabled={saving}
                        variant="contained"
                        color="error"
                        onClick={hide}
                        startIcon={<AdminDeleteIcon />}
                        sx={clinicButtonSx}
                    >
                        {saving ? "Đang lưu..." : "Ngừng sử dụng"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
