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

const ACTIVE_STATUS = {
    true: {
        label: "Đang áp dụng",
        color: "#047857",
        borderColor: "#A7F3D0",
        backgroundColor: "#ECFDF5",
    },
    false: {
        label: "Tạm ngưng",
        color: "#B45309",
        borderColor: "#FDE68A",
        backgroundColor: "#FFFBEB",
    },
};

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function DiseasesTable({
    diseases,
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
                <Table sx={{ minWidth: 980 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                            {[
                                "Mã bệnh",
                                "Tên bệnh",
                                "Mô tả / ghi chú",
                                "Trạng thái",
                                "Ngày tạo",
                                "Thao tác",
                            ].map((header) => (
                                <TableCell
                                    key={header}
                                    align={
                                        header === "Thao tác"
                                            ? "center"
                                            : "left"
                                    }
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
                        {diseases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState message="Chưa có bệnh phù hợp. Thêm bệnh mới hoặc điều chỉnh bộ lọc để xem dữ liệu." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            diseases.map((disease) => {
                                const status =
                                    ACTIVE_STATUS[
                                        String(disease.isActive)
                                    ] || ACTIVE_STATUS.false;

                                return (
                                    <TableRow
                                        hover
                                        key={disease.diseaseId}
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
                                                    fontWeight: 900,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {disease.diseaseCode}
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
                                                {disease.diseaseName}
                                            </Typography>
                                        </TableCell>

                                        <TableCell sx={{ maxWidth: 420 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: disease.description
                                                        ? "#374151"
                                                        : "#9CA3AF",
                                                    lineHeight: 1.55,
                                                }}
                                            >
                                                {disease.description ||
                                                    "Chưa có mô tả"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={status.label}
                                                size="small"
                                                sx={{
                                                    minWidth: 116,
                                                    borderRadius: 999,
                                                    color: status.color,
                                                    border: "1px solid",
                                                    borderColor:
                                                        status.borderColor,
                                                    backgroundColor:
                                                        status.backgroundColor,
                                                    fontWeight: 800,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#4B5563",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {formatDate(
                                                    disease.createdAt
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="center"
                                            >
                                                <Tooltip title="Sửa bệnh">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            onEdit(
                                                                disease
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

                                                <Tooltip title="Xóa bệnh">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            onDelete(
                                                                disease
                                                            )
                                                        }
                                                        sx={{
                                                            color:
                                                                "#E11D48",
                                                            backgroundColor:
                                                                "#FEF2F2",
                                                        }}
                                                    >
                                                        <DeleteOutlineOutlinedIcon fontSize="small" />
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

export default DiseasesTable;
