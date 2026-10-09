import {
    Box,
    Button,
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
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";

import EmptyState from "../../common/EmptyState";
import formatCurrency from "../../../utils/formatCurrency";
import formatDate from "../../../utils/formatDate";
import { getDispensingStatusConfig } from "./dispensingStatus";

function StatusChip({ status }) {
    const config = getDispensingStatusConfig(status);

    return (
        <Chip
            label={config.label}
            size="small"
            sx={{
                color: config.color,
                backgroundColor: config.backgroundColor,
                border: `1px solid ${config.borderColor}`,
                fontWeight: 800,
            }}
        />
    );
}

function DispensingTable({
    items,
    pagination,
    filters,
    selectedId,
    onSelect,
    onPageChange,
    onPageSizeChange,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: "1px solid #E5E9F0",
                overflow: "hidden",
            }}
        >
            <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                            {[
                                "Mã đơn & bệnh nhân",
                                "Ngày kê",
                                "Quy cách",
                                "Hóa đơn",
                                "Dự tính",
                                "Trạng thái",
                                "Thao tác",
                            ].map((header) => (
                                <TableCell
                                    key={header}
                                    align={header === "Thao tác" ? "center" : "left"}
                                    sx={{
                                        color: "#6B7280",
                                        fontSize: 12,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        borderColor: "#E5E9F0",
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <EmptyState message="Không có đơn thuốc phù hợp với bộ lọc hiện tại." />
                                </TableCell>
                            </TableRow>
                        ) : items.map((item) => (
                            <TableRow
                                hover
                                key={item.prescriptionId}
                                selected={selectedId === item.prescriptionId}
                                onClick={() => onSelect(item)}
                                sx={{
                                    cursor: "pointer",
                                    "& td": { borderColor: "#EEF2F7" },
                                    "&.Mui-selected": { backgroundColor: "#EFF6FF" },
                                    "&.Mui-selected:hover": { backgroundColor: "#E6F1FD" },
                                }}
                            >
                                <TableCell>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 1.5,
                                                display: "grid",
                                                placeItems: "center",
                                                color: "#005DAC",
                                                backgroundColor: "#EFF6FF",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <MedicationOutlinedIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ color: "#005DAC", fontWeight: 900 }}>
                                                {item.prescriptionCode}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#1F2937", fontWeight: 800 }}>
                                                {item.patientName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.patientPhone || "Chưa có số điện thoại"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>

                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {formatDate(item.prescriptionDate)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        BS. {item.doctorName}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        {item.totalItems} loại
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {Number(item.totalQuantity || 0).toLocaleString("vi-VN")} đơn vị
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    {item.invoiceId ? (
                                        <>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                HD-{String(item.invoiceId).padStart(5, "0")}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#047857", fontWeight: 700 }}>
                                                Đã thanh toán
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: "#B45309", fontWeight: 700 }}>
                                            Chưa thanh toán
                                        </Typography>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        {formatCurrency(item.estimatedTotalAmount)}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    <StatusChip status={item.workflowStatus} />
                                </TableCell>

                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        variant={selectedId === item.prescriptionId ? "contained" : "outlined"}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onSelect(item);
                                        }}
                                        sx={{ whiteSpace: "nowrap", fontWeight: 800 }}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ borderTop: "1px solid #E5E9F0" }}>
                <TablePagination
                    component="div"
                    count={pagination?.totalItems || 0}
                    page={Math.max((filters.pageNumber || 1) - 1, 0)}
                    onPageChange={(_, page) => onPageChange(page + 1)}
                    rowsPerPage={filters.pageSize}
                    onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
                    rowsPerPageOptions={[5, 10, 20]}
                    labelRowsPerPage="Số dòng/trang"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                />
            </Box>
        </Paper>
    );
}

export default DispensingTable;
