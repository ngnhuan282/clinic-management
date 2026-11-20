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
import formatCurrency from "../../../utils/formatCurrency";
import { getStockStatusConfig } from "./medicineStatus";

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN").format(
        new Date(value)
    );
}

function MedicinesTable({
    medicines,
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
                <Table sx={{ minWidth: 1120 }}>
                    <TableHead>
                        <TableRow
                            sx={{
                                backgroundColor: "#F8FAFC",
                            }}
                        >
                            {[
                                "Mã thuốc",
                                "Tên thuốc",
                                "Danh mục",
                                "Nhà cung cấp",
                                "ĐVT",
                                "Giá bán",
                                "Tồn kho",
                                "Hạn gần nhất",
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
                        {medicines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10}>
                                    <EmptyState
                                        message="Chưa có thuốc phù hợp. Thêm thuốc mới hoặc điều chỉnh bộ lọc để xem dữ liệu."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            medicines.map((medicine) => {
                                const status =
                                    getStockStatusConfig(
                                        medicine.stockStatus
                                    );

                                return (
                                    <TableRow
                                        hover
                                        key={medicine.medicineId}
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
                                                    color: "#2563EB",
                                                    fontWeight: 800,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {medicine.medicineCode}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#1F2937",
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {medicine.medicineName}
                                            </Typography>

                                            {medicine.description && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {
                                                        medicine.description
                                                    }
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={
                                                    medicine.categoryName
                                                }
                                                size="small"
                                                sx={{
                                                    borderRadius: 1,
                                                    color: "#005DAC",
                                                    backgroundColor:
                                                        "#EFF6FF",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            {medicine.supplierName ||
                                                "-"}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={medicine.unit}
                                                size="small"
                                                sx={{
                                                    borderRadius: 1,
                                                    backgroundColor:
                                                        "#F3F4F6",
                                                    color: "#374151",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {formatCurrency(
                                                medicine.unitPrice
                                            )}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                color:
                                                    medicine.totalQuantityInStock >
                                                    0
                                                        ? "#059669"
                                                        : "#E11D48",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {
                                                medicine.totalQuantityInStock
                                            }{" "}
                                            {medicine.unit}
                                        </TableCell>

                                        <TableCell>
                                            {formatDate(
                                                medicine.nearestExpiryDate
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={status.label}
                                                size="small"
                                                sx={{
                                                    minWidth: 108,
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
                                                <Tooltip title="Sửa thuốc">
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Sửa ${medicine.medicineName}`}
                                                        onClick={() =>
                                                            onEdit(
                                                                medicine
                                                            )
                                                        }
                                                        sx={adminEditIconButtonSx}
                                                    >
                                                        <AdminEditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Xóa thuốc">
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Xóa ${medicine.medicineName}`}
                                                        onClick={() =>
                                                            onDelete(
                                                                medicine
                                                            )
                                                        }
                                                        sx={adminDeleteIconButtonSx}
                                                    >
                                                        <AdminDeleteIcon fontSize="small" />
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

            <ClinicPagination
                page={filters.pageNumber}
                pageSize={filters.pageSize}
                totalItems={totalItems}
                label="thuốc"
                navLabel="Phân trang danh mục thuốc"
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </Paper>
    );
}

export default MedicinesTable;
