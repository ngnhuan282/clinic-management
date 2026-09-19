import {
    Box,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import EmptyState from "../../common/EmptyState";

const STATUS_CONFIG = {
    InUse: {
        label: "Đang áp dụng",
        color: "#047857",
        borderColor: "#A7F3D0",
        backgroundColor: "#ECFDF5",
    },
    Empty: {
        label: "Chưa có thuốc",
        color: "#B45309",
        borderColor: "#FDE68A",
        backgroundColor: "#FFFBEB",
    },
};

function MedicineCategoriesTable({
    categories,
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
                <Table sx={{ minWidth: 920 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                            {[
                                "Mã danh mục",
                                "Tên danh mục",
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
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <EmptyState message="Chưa có danh mục thuốc phù hợp. Thêm danh mục mới hoặc điều chỉnh bộ lọc để xem dữ liệu." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => {
                                const status =
                                    STATUS_CONFIG[
                                        category.usageStatus
                                    ] || STATUS_CONFIG.Empty;

                                return (
                                    <TableRow
                                        hover
                                        key={category.categoryId}
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
                                                {
                                                    category.categoryCode
                                                }
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
                                                {
                                                    category.categoryName
                                                }
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={`${category.medicineCount} thuốc`}
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
                                                spacing={0.5}
                                            >
                                                <Tooltip title="Sửa danh mục">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            onEdit(
                                                                category
                                                            )
                                                        }
                                                        sx={{
                                                            color:
                                                                "#2563EB",
                                                            backgroundColor:
                                                                "#EFF6FF",
                                                        }}
                                                    >
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Xóa danh mục">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                onDelete(
                                                                    category
                                                                )
                                                            }
                                                            disabled={
                                                                category.medicineCount >
                                                                0
                                                            }
                                                            sx={{
                                                                color:
                                                                    "#E11D48",
                                                                backgroundColor:
                                                                    "#FEF2F2",
                                                                "&.Mui-disabled":
                                                                    {
                                                                        color:
                                                                            "#CBD5E1",
                                                                        backgroundColor:
                                                                            "#F8FAFC",
                                                                    },
                                                            }}
                                                        >
                                                            <DeleteOutlineOutlinedIcon fontSize="small" />
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
                        onPageSizeChange(Number(event.target.value))
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

export default MedicineCategoriesTable;
