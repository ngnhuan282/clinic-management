import {
    Chip,
    IconButton,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { ClinicPagination } from "../../common/ClinicPageHeader";
import EmptyState from "../../common/EmptyState";
import {
    AdminDeleteIcon,
    AdminEditIcon,
    adminDeleteIconButtonSx,
    adminEditIconButtonSx,
    clinicColors,
    clinicSurfaceSx,
    clinicTableSx,
} from "../../common/clinicUi";

const activeStatus = {
    true: {
        label: "Đang áp dụng",
        color: "#065F46",
        backgroundColor: "#DCFCE7",
        borderColor: "#86EFAC",
    },
    false: {
        label: "Tạm ngưng",
        color: "#92400E",
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
};

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
          }).format(new Date(value))
        : "–";

export default function DiseasesTable({
    diseases,
    pagination,
    filters,
    loading,
    saving,
    error,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete,
}) {
    const totalItems = pagination?.totalItems || 0;
    const currentPage = Math.min(
        Math.max(filters.pageNumber, 1),
        Math.max(1, Math.ceil(totalItems / filters.pageSize))
    );

    return (
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ p: 2.5, alignItems: "center", borderBottom: "1px solid #E4ECF5" }}
            >
                <Typography sx={{ fontWeight: 750, color: clinicColors.heading }}>
                    Danh sách bệnh
                </Typography>
                {!loading && !error && (
                    <Chip
                        size="small"
                        label={`${totalItems} bệnh`}
                        sx={{ bgcolor: "#E8F2FC", color: clinicColors.primary, fontWeight: 700 }}
                    />
                )}
            </Stack>
            {loading && <LinearProgress aria-label="Đang tải danh mục bệnh" />}
            <Typography
                sx={{
                    px: 2.5,
                    pt: 1.5,
                    display: { xs: "block", md: "none" },
                    fontSize: 12,
                    color: clinicColors.muted,
                }}
            >
                Vuốt ngang bảng để xem đầy đủ thông tin và thao tác.
            </Typography>
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table aria-label="Danh sách bệnh" sx={{ ...clinicTableSx, minWidth: 940 }}>
                    <TableHead>
                        <TableRow>
                            {[
                                "Mã bệnh",
                                "Tên bệnh",
                                "Mô tả / ghi chú",
                                "Trạng thái",
                                "Ngày tạo",
                                "Thao tác",
                            ].map((label) => (
                                <TableCell
                                    key={label}
                                    align={label === "Thao tác" ? "right" : "left"}
                                >
                                    {label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }, (_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: 6 }, (_, cell) => (
                                        <TableCell key={cell}>
                                            <Skeleton />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState message="Chưa tải được danh mục bệnh. Hãy thử tải lại dữ liệu." />
                                </TableCell>
                            </TableRow>
                        ) : diseases.length ? (
                            diseases.map((disease) => {
                                const status =
                                    activeStatus[String(disease.isActive)] || activeStatus.false;
                                return (
                                    <TableRow hover key={disease.diseaseId}>
                                        <TableCell
                                            sx={{
                                                color: clinicColors.primary,
                                                fontWeight: 750,
                                                fontVariantNumeric: "tabular-nums",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {disease.diseaseCode}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 180, maxWidth: 260 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: clinicColors.heading,
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {disease.diseaseName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 360 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 13.5,
                                                    color: clinicColors.muted,
                                                    lineHeight: 1.6,
                                                    whiteSpace: "pre-wrap",
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {disease.description || "Chưa có mô tả"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={status.label}
                                                sx={{
                                                    color: status.color,
                                                    bgcolor: status.backgroundColor,
                                                    border: `1px solid ${status.borderColor}`,
                                                    fontWeight: 650,
                                                    whiteSpace: "nowrap",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: clinicColors.muted, whiteSpace: "nowrap" }}>
                                            {formatDate(disease.createdAt)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                sx={{ justifyContent: "flex-end" }}
                                            >
                                                <Tooltip title="Sửa bệnh">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            aria-label={`Sửa bệnh ${disease.diseaseCode}`}
                                                            disabled={saving}
                                                            onClick={() => onEdit(disease)}
                                                            sx={adminEditIconButtonSx}
                                                        >
                                                            <AdminEditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Xóa bệnh">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            aria-label={`Xóa bệnh ${disease.diseaseCode}`}
                                                            disabled={saving}
                                                            onClick={() => onDelete(disease)}
                                                            sx={adminDeleteIconButtonSx}
                                                        >
                                                            <AdminDeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState message="Không có bệnh phù hợp. Hãy đổi bộ lọc hoặc thêm bệnh mới." />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <ClinicPagination
                page={currentPage}
                pageSize={filters.pageSize}
                totalItems={totalItems}
                label="bệnh"
                disabled={loading || saving}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </Paper>
    );
}
