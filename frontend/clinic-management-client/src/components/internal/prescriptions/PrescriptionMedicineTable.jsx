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
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";

import EmptyState from "../../common/EmptyState";
import formatCurrency from "../../../utils/formatCurrency";
import { getPrescriptionStockStatusConfig } from "./prescriptionStockStatus";

const headerCells = [
    { label: "STT", width: 52 },
    { label: "Thuốc", width: "23%" },
    { label: "Tồn khả dụng", width: 112 },
    { label: "Số lượng", width: 126 },
    { label: "Liều dùng", width: "17%" },
    { label: "Hướng dẫn", width: "25%" },
    { label: "Thao tác", width: 86, align: "center" },
];

function QuantityStepper({ value, onChange, disabled }) {
    const numericValue = Number(value || 0);

    return (
        <Stack
            direction="row"
            alignItems="center"
            sx={{
                width: 112,
                border: "1px solid #D1D5DB",
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
            }}
        >
            <IconButton
                size="small"
                disabled={disabled || numericValue <= 1}
                onClick={() => onChange(Math.max(1, numericValue - 1))}
                sx={{ borderRadius: 0, width: 32, height: 36 }}
            >
                <RemoveRoundedIcon fontSize="small" />
            </IconButton>

            <TextField
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                inputProps={{
                    min: 1,
                    type: "number",
                    style: {
                        textAlign: "center",
                        fontWeight: 800,
                        padding: "8px 4px",
                    },
                }}
                sx={{
                    width: 48,
                    "& fieldset": { border: 0 },
                    "& .MuiInputBase-root": {
                        height: 36,
                        borderRadius: 0,
                    },
                }}
            />

            <IconButton
                size="small"
                disabled={disabled}
                onClick={() => onChange(numericValue + 1)}
                sx={{ borderRadius: 0, width: 32, height: 36 }}
            >
                <AddRoundedIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
}

function PrescriptionMedicineTable({
    details,
    onUpdateDetail,
    onRemoveDetail,
    disabled = false,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: "1px solid #E5E9F0",
                overflow: "hidden",
                bgcolor: "#FFFFFF",
            }}
        >
            <Box
                sx={{
                    px: { xs: 2, md: 2.5 },
                    py: 2,
                    borderBottom: "1px solid #E5E9F0",
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#1F2937",
                        fontWeight: 900,
                    }}
                >
                    Danh mục thuốc kê trong đơn
                </Typography>
            </Box>

            <TableContainer>
                <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                            {headerCells.map((header) => (
                                <TableCell
                                    key={header.label}
                                    align={header.align || "left"}
                                    sx={{
                                        width: header.width,
                                        color: "#6B7280",
                                        fontSize: 12,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.02em",
                                        borderColor: "#E5E9F0",
                                    }}
                                >
                                    {header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {details.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={headerCells.length}>
                                    <EmptyState message="Chưa có thuốc trong đơn." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            details.map((detail, index) => {
                                const medicine = detail.medicine;
                                const status =
                                    getPrescriptionStockStatusConfig(
                                        detail.stockStatus
                                    );

                                return (
                                    <TableRow
                                        key={detail.localId}
                                        hover
                                        sx={{
                                            "& td": {
                                                borderColor: "#EEF2F7",
                                                verticalAlign: "top",
                                            },
                                            bgcolor:
                                                detail.stockStatus ===
                                                "OutOfStock"
                                                    ? "#FEF2F2"
                                                    : "inherit",
                                        }}
                                    >
                                        <TableCell
                                            sx={{
                                                color: "#005DAC",
                                                fontWeight: 800,
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {index + 1}
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#111827",
                                                    fontWeight: 900,
                                                    lineHeight: 1.35,
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {medicine?.medicineName ||
                                                    "Thuốc"}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ lineHeight: 1.5 }}
                                            >
                                                {medicine?.medicineCode || "-"}{" "}
                                                · {medicine?.unit || "-"} ·{" "}
                                                {formatCurrency(
                                                    medicine?.unitPrice
                                                )}
                                                /{medicine?.unit || "đơn vị"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: status.color,
                                                    fontWeight: 900,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {detail.availableQuantity}{" "}
                                                {medicine?.unit || ""}
                                            </Typography>

                                            <Chip
                                                size="small"
                                                label={status.label}
                                                sx={{
                                                    mt: 0.75,
                                                    maxWidth: "100%",
                                                    color: status.color,
                                                    bgcolor:
                                                        status.backgroundColor,
                                                    border:
                                                        `1px solid ${status.borderColor}`,
                                                    fontWeight: 800,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <QuantityStepper
                                                value={detail.quantity}
                                                disabled={disabled}
                                                onChange={(value) =>
                                                    onUpdateDetail(
                                                        detail.localId,
                                                        "quantity",
                                                        value
                                                    )
                                                }
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <TextField
                                                value={detail.dosage}
                                                disabled={disabled}
                                                onChange={(event) =>
                                                    onUpdateDetail(
                                                        detail.localId,
                                                        "dosage",
                                                        event.target.value
                                                    )
                                                }
                                                size="small"
                                                fullWidth
                                                placeholder="Sáng 1 viên"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <TextField
                                                value={detail.instructions}
                                                disabled={disabled}
                                                onChange={(event) =>
                                                    onUpdateDetail(
                                                        detail.localId,
                                                        "instructions",
                                                        event.target.value
                                                    )
                                                }
                                                size="small"
                                                fullWidth
                                                placeholder="Uống sau ăn"
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Tooltip title="Xóa thuốc">
                                                <span>
                                                    <IconButton
                                                        aria-label="Xóa thuốc"
                                                        disabled={disabled}
                                                        onClick={() =>
                                                            onRemoveDetail(
                                                                detail.localId
                                                            )
                                                        }
                                                        sx={{
                                                            color: "#DC2626",
                                                            bgcolor:
                                                                "#FEF2F2",
                                                            "&:hover": {
                                                                bgcolor:
                                                                    "#FEE2E2",
                                                            },
                                                        }}
                                                    >
                                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default PrescriptionMedicineTable;
