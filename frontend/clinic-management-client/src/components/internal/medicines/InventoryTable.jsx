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
    TableSortLabel,
    Typography,
} from "@mui/material";

import EmptyState from "../../common/EmptyState";
import formatCurrency from "../../../utils/formatCurrency";
import formatDate from "../../../utils/formatDate";
import { getInventoryExpiryText, getInventoryStatusConfig, getInventoryStatuses } from "./inventoryStatus";

function InventoryTable({
    inventoryItems,
    pagination,
    filters,
    onPageChange,
    onPageSizeChange,
    onSortChange,
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
                                { label: "Thuốc & số lô", sort: "medicine" },
                                { label: "Danh mục" },
                                { label: "Nhà cung cấp" },
                                { label: "ĐVT" },
                                { label: "Giá bán" },
                                { label: "Tồn kho", sort: "quantity" },
                                { label: "Hạn dùng", sort: "expiry" },
                                { label: "Trạng thái" },
                            ].map((header) => (
                                <TableCell
                                    key={header.label}
                                    sortDirection={header.sort === filters.sortBy ? filters.sortOrder : false}
                                    sx={{
                                        color: "#6B7280",
                                        fontSize: 12,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: 0,
                                        borderColor: "#E5E9F0",
                                    }}
                                >
                                    {header.sort ? (
                                        <TableSortLabel
                                            active={header.sort === filters.sortBy}
                                            direction={header.sort === filters.sortBy ? filters.sortOrder : "asc"}
                                            onClick={() => onSortChange({
                                                sortBy: header.sort,
                                                sortOrder: header.sort === filters.sortBy && filters.sortOrder === "asc" ? "desc" : "asc",
                                                pageNumber: 1,
                                            })}
                                        >
                                            {header.label}
                                        </TableSortLabel>
                                    ) : header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {inventoryItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <EmptyState message="Không có lô tồn kho phù hợp." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventoryItems.map((item) => {
                                const statuses = getInventoryStatuses(item);
                                const status = getInventoryStatusConfig(statuses[0]);
                                const isExpired = item.daysUntilExpiry < 0;

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
                                                        flexShrink: 0,
                                                        whiteSpace: "nowrap",
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
                                                        !isExpired && item.quantityInStock >
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
                                            {isExpired && item.quantityInStock > 0 && (
                                                <Typography variant="caption" color="error.main">
                                                    Khả dụng: {item.availableQuantity ?? 0}
                                                </Typography>
                                            )}
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
                                                    color: isExpired ? "#991B1B" : item.daysUntilExpiry <= 30 ? "#C2410C" : "#047857",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {getInventoryExpiryText(item)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Stack spacing={0.75} alignItems="flex-start">
                                                {statuses.map((value) => {
                                                    const badge = getInventoryStatusConfig(value);
                                                    return <Chip key={value} label={badge.label} size="small" sx={{
                                                        minWidth: 108, borderRadius: 999, color: badge.color,
                                                        border: "1px solid", borderColor: badge.borderColor,
                                                        backgroundColor: badge.backgroundColor, fontWeight: 800,
                                                    }} />;
                                                })}
                                            </Stack>
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
                    sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end", pl: 1 } }}
                />
            </Box>
        </Paper>
    );
}

export default InventoryTable;
