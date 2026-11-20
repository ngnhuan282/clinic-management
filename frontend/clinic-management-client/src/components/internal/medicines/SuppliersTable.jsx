import {
    Chip,
    IconButton,
    Paper,
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
import { AdminDeleteIcon, AdminEditIcon, adminDeleteIconButtonSx, adminEditIconButtonSx } from "../../common/clinicUi";
import EmptyState from "../../common/EmptyState";

const STATUS_CONFIG = {
    InUse: {
        label: "Đang liên kết",
        color: "#047857",
        borderColor: "#A7F3D0",
        backgroundColor: "#ECFDF5",
    },
    Empty: {
        label: "Chưa dùng",
        color: "#B45309",
        borderColor: "#FDE68A",
        backgroundColor: "#FFFBEB",
    },
};

function SuppliersTable({
    suppliers,
    pagination,
    filters,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete,
}) {
    const totalItems = pagination?.totalItems || 0;

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: "1px solid #E5E9F0",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
            }}
        >
            <TableContainer>
                <Table sx={{ minWidth: 1040 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                            {[
                                "Mã & tên nhà cung cấp",
                                "Liên hệ",
                                "Địa chỉ",
                                "Số thuốc",
                                "Trạng thái",
                                "Thao tác",
                            ].map((header) => (
                                <TableCell
                                    key={header}
                                    sx={{
                                        color: "#6B7280",
                                        fontSize: 12,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.02em",
                                        borderColor: "#E5E9F0",
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState message="Chưa có nhà cung cấp phù hợp. Thêm nhà cung cấp mới hoặc điều chỉnh bộ lọc để xem dữ liệu." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => {
                                const status =
                                    STATUS_CONFIG[
                                        supplier.usageStatus
                                    ] || STATUS_CONFIG.Empty;

                                return (
                                    <TableRow
                                        hover
                                        key={supplier.supplierId}
                                        sx={{
                                            "& td": {
                                                borderColor:
                                                    "#EEF2F7",
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#1F2937",
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {
                                                    supplier.supplierName
                                                }
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "#2563EB",
                                                    fontWeight: 800,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {
                                                    supplier.supplierCode
                                                }
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            {supplier.contactInfo || "-"}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                maxWidth: 280,
                                                color: "#4B5563",
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                title={
                                                    supplier.address ||
                                                    ""
                                                }
                                            >
                                                {supplier.address ||
                                                    "-"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={`${supplier.medicineCount} thuốc`}
                                                size="small"
                                                sx={{
                                                    minWidth: 88,
                                                    borderRadius: 999,
                                                    color: "#005DAC",
                                                    backgroundColor:
                                                        "#EFF6FF",
                                                    fontWeight: 800,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={status.label}
                                                size="small"
                                                sx={{
                                                    minWidth: 116,
                                                    borderRadius: 999,
                                                    color: status.color,
                                                    border:
                                                        "1px solid",
                                                    borderColor:
                                                        status.borderColor,
                                                    backgroundColor:
                                                        status.backgroundColor,
                                                    fontWeight: 800,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                            >
                                                <Tooltip title="Sửa nhà cung cấp">
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Sửa ${supplier.supplierName}`}
                                                        onClick={() =>
                                                            onEdit(
                                                                supplier
                                                            )
                                                        }
                                                        sx={adminEditIconButtonSx}
                                                    >
                                                        <AdminEditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Xóa nhà cung cấp">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            aria-label={`Xóa ${supplier.supplierName}`}
                                                            onClick={() =>
                                                                onDelete(
                                                                    supplier
                                                                )
                                                            }
                                                            disabled={
                                                                supplier.medicineCount >
                                                                0
                                                            }
                                                            sx={adminDeleteIconButtonSx}
                                                        >
                                                            <AdminDeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
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

            <ClinicPagination
                page={filters.pageNumber}
                pageSize={filters.pageSize}
                totalItems={totalItems}
                label="nhà cung cấp"
                navLabel="Phân trang nhà cung cấp"
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </Paper>
    );
}

export default SuppliersTable;
