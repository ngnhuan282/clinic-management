import {
    Box,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";

import EmptyState from "../../common/EmptyState";
import formatCurrency from "../../../utils/formatCurrency";
import formatDate from "../../../utils/formatDate";
import { getInventoryStatusConfig } from "./inventoryStatus";

function getExpiryText(item) {
    if (item.stockStatus === "Expired") {
        return `Quá hạn ${Math.abs(item.daysUntilExpiry)} ngày`;
    }

    if (item.daysUntilExpiry === 0) {
        return "Hết hạn hôm nay";
    }

    if (item.daysUntilExpiry > 0) {
        return `Còn ${item.daysUntilExpiry} ngày`;
    }

    return "-";
}

function InventoryTable({
    inventoryItems,
    pagination,
    filters,
    onPageChange,
    onPageSizeChange,
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
                                "Thuốc & số lô",
                                "Danh mục",
                                "Nhà cung cấp",
                                "ĐVT",
                                "Giá bán",
                                "Tồn kho",
                                "Hạn dùng",
                                "Trạng thái",
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
                        {inventoryItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <EmptyState message="Chưa có lô tồn kho phù hợp. Hãy điều chỉnh bộ lọc hoặc tạo phiếu nhập kho." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventoryItems.map((item) => {
                                const status =
                                    getInventoryStatusConfig(
                                        item.stockStatus
                                    );

                                return (
                                    <TableRow
                                        hover
                                        key={item.inventoryId}
                                        sx={{
                                            backgroundColor:
                                                status.rowBackground,
                                            "&:hover": {
                                                backgroundColor:
                                                    status.rowBackground,
                                            },
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
                                                {item.medicineName}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                alignItems="center"
                                                flexWrap="wrap"
                                                useFlexGap
                                                sx={{ mt: 0.75 }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: "#2563EB",
                                                        fontWeight: 800,
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {item.medicineCode}
                                                </Typography>

                                                <Chip
                                                    label={item.batchNumber}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        borderRadius: 1,
                                                        color: "#005DAC",
                                                        backgroundColor:
                                                            "#EFF6FF",
                                                        fontWeight: 800,
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                />
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={item.categoryName}
                                                size="small"
                                                sx={{
                                                    borderRadius: 999,
                                                    color: "#005DAC",
                                                    backgroundColor:
                                                        "#EFF6FF",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#374151",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {item.supplierName ||
                                                    "-"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={item.unit}
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
                                                item.unitPrice
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color:
                                                        item.quantityInStock >
                                                        0
                                                            ? "#047857"
                                                            : "#E11D48",
                                                    fontWeight: 900,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {item.quantityInStock}{" "}
                                                {item.unit}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#1F2937",
                                                    fontWeight: 800,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {formatDate(
                                                    item.expiryDate
                                                )}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: status.color,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {getExpiryText(item)}
                                            </Typography>
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

                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box
                sx={{
                    borderTop: "1px solid #E5E9F0",
                    backgroundColor: "#FFFFFF",
                }}
            >
                <TablePagination
                    component="div"
                    count={totalItems}
                    page={Math.max(filters.pageNumber - 1, 0)}
                    rowsPerPage={filters.pageSize}
                    onPageChange={(_, page) =>
                        onPageChange(page + 1)
                    }
                    onRowsPerPageChange={(event) =>
                        onPageSizeChange(
                            Number(event.target.value)
                        )
                    }
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    labelRowsPerPage="Số dòng:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} trong ${count}`
                    }
                />
            </Box>
        </Paper>
    );
}

export default InventoryTable;
