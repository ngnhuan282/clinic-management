import {
    Alert,
    Box,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import formatCurrency from "../../../utils/formatCurrency";

function SummaryRow({ label, value, color = "#1F2937" }) {
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ minWidth: 0 }}
        >
            <Typography
                variant="body2"
                sx={{ color: "#6B7280", minWidth: 0 }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function PrescriptionSummaryPanel({
    totals,
    notes,
    onNotesChange,
    disabled = false,
}) {
    const hasWarnings = totals.stockWarningCount > 0;

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 2,
                    border: "1px solid #E5E9F0",
                    bgcolor: "#FFFFFF",
                }}
            >
                <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 1.5,
                            color: "#005DAC",
                            bgcolor: "#EFF6FF",
                        }}
                    >
                        <ReceiptLongOutlinedIcon fontSize="small" />
                    </Box>
                    <Typography
                        variant="subtitle1"
                        sx={{ color: "#1F2937", fontWeight: 900 }}
                    >
                        Tóm tắt đơn thuốc
                    </Typography>
                </Stack>

                <Stack spacing={1.5}>
                    <SummaryRow
                        label="Số thuốc"
                        value={`${totals.totalItems} loại`}
                    />
                    <SummaryRow
                        label="Tổng số lượng"
                        value={totals.totalQuantity}
                    />
                    <SummaryRow
                        label="Cảnh báo tồn"
                        value={totals.stockWarningCount}
                        color={hasWarnings ? "#DC2626" : "#059669"}
                    />
                    <Divider />
                    <SummaryRow
                        label="Dự tính chi phí"
                        value={formatCurrency(
                            totals.estimatedTotalAmount
                        )}
                        color="#005DAC"
                    />
                </Stack>

                <Alert
                    severity={hasWarnings ? "warning" : "info"}
                    icon={
                        hasWarnings ? (
                            <WarningAmberOutlinedIcon />
                        ) : (
                            <Inventory2OutlinedIcon />
                        )
                    }
                    sx={{
                        mt: 2,
                        border:
                            "1px solid " +
                            (hasWarnings ? "#FDE68A" : "#BFDBFE"),
                    }}
                >
                    {hasWarnings
                        ? "Có thuốc chưa đáp ứng đủ tồn khả dụng."
                        : "Tồn kho chỉ được kiểm tra cảnh báo, chưa bị trừ khi lưu đơn."}
                </Alert>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 2,
                    border: "1px solid #E5E9F0",
                    bgcolor: "#FFFFFF",
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{ color: "#1F2937", fontWeight: 900, mb: 1.5 }}
                >
                    Lời dặn bác sĩ
                </Typography>

                <TextField
                    value={notes}
                    disabled={disabled}
                    onChange={(event) =>
                        onNotesChange(event.target.value)
                    }
                    fullWidth
                    multiline
                    minRows={5}
                    placeholder="Nhập lời dặn hoặc ghi chú cho đơn thuốc"
                />
            </Paper>
        </Stack>
    );
}

export default PrescriptionSummaryPanel;
