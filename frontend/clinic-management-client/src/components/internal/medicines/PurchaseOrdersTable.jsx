import {
    Button,
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
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";

import { ClinicPagination } from "../../common/ClinicPageHeader";
import { AdminCancelIcon, AdminEditIcon, AdminViewIcon, adminDeleteIconButtonSx, adminEditIconButtonSx, adminViewIconButtonSx } from "../../common/clinicUi";
import EmptyState from "../../common/EmptyState";
import formatCurrency from "../../../utils/formatCurrency";
import formatDate from "../../../utils/formatDate";
import { getPurchaseOrderStatusConfig } from "./purchaseOrderStatus";

function StatusChip({ status }) {
    const config = getPurchaseOrderStatusConfig(status);

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

function PurchaseOrdersTable({
    purchaseOrders,
    pagination,
    filters,
    onPageChange,
    onPageSizeChange,
    onView,
    onEdit,
    onReceive,
    onCancel,
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
                <Table sx={{ minWidth: 1080 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                            {[
                                "Mã phiếu",
                                "Nhà cung cấp",
                                "Ngày tạo",
                                "Mặt hàng",
                                "Tổng số lượng",
                                "Tổng tiền nhập",
                                "Trạng thái",
                                "Người tạo",
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
                        {purchaseOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9}>
                                    <EmptyState message="Chưa có phiếu nhập kho phù hợp. Tạo phiếu mới hoặc điều chỉnh bộ lọc để xem dữ liệu." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            purchaseOrders.map((order) => {
                                const isDraft = order.status === "Draft";

                                return (
                                    <TableRow
                                        hover
                                        key={order.purchaseOrderId}
                                        sx={{
                                            "& td": { borderColor: "#EEF2F7" },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#005DAC",
                                                    fontWeight: 800,
                                                    fontVariantNumeric: "tabular-nums",
                                                }}
                                            >
                                                {order.purchaseOrderCode}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#1F2937", fontWeight: 700 }}
                                            >
                                                {order.supplierName}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontVariantNumeric: "tabular-nums" }}
                                            >
                                                {formatDate(order.orderDate)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={`${order.itemCount} loại thuốc`}
                                                size="small"
                                                sx={{
                                                    color: "#475569",
                                                    backgroundColor: "#F1F5F9",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                                            >
                                                {Number(order.totalQuantity || 0).toLocaleString("vi-VN")}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#1F2937", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
                                            >
                                                {formatCurrency(order.totalAmount)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <StatusChip status={order.status} />
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {order.createdByName}
                                            </Typography>
                                            {order.receivedByName && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Nhập bởi {order.receivedByName}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell align="center">
                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                sx={{
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Tooltip title="Xem phiếu">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Xem phiếu nhập"
                                                        onClick={() => onView(order)}
                                                        sx={adminViewIconButtonSx}
                                                    >
                                                        <AdminViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                {isDraft && (
                                                    <>
                                                        <Tooltip title="Chỉnh sửa">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Chỉnh sửa phiếu nhập"
                                                                onClick={() => onEdit(order)}
                                                                sx={adminEditIconButtonSx}
                                                            >
                                                                <AdminEditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            startIcon={<InventoryOutlinedIcon />}
                                                            onClick={() => onReceive(order)}
                                                            sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                                                        >
                                                            Nhập kho
                                                        </Button>

                                                        <Tooltip title="Hủy phiếu">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Hủy phiếu nhập"
                                                                onClick={() => onCancel(order)}
                                                                sx={adminDeleteIconButtonSx}
                                                            >
                                                                <AdminCancelIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
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
                page={filters.pageNumber || 1}
                pageSize={filters.pageSize}
                totalItems={totalItems}
                label="phiếu nhập"
                navLabel="Phân trang phiếu nhập kho"
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </Paper>
    );
}

export default PurchaseOrdersTable;
