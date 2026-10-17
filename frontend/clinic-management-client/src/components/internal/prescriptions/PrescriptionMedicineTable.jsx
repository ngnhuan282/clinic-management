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
import { getPrescriptionTextError, PRESCRIPTION_TEXT_LIMITS } from "../../../validators/prescriptionValidator";

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
                aria-label="Giảm số lượng"
                size="small"
                disabled={disabled || numericValue <= 1}
                onClick={() => onChange(Math.max(1, numericValue - 1))}
                sx={{ borderRadius: 0, width: 32, height: 36 }}
            >
                <RemoveRoundedIcon fontSize="small" />
            </IconButton>

            <TextField
                type="number"
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                slotProps={{ htmlInput: {
                    min: 1,
                    max: 2147483647,
                    step: 1,
                    "aria-label": "Số lượng kê đơn",
                    style: {
                        textAlign: "center",
                        fontWeight: 800,
                        padding: "8px 4px",
                    },
                } }}
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
                aria-label="Tăng số lượng"
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
    embedded = false,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: embedded ? 0 : 2,
                border: embedded ? 0 : "1px solid #E5E9F0",
                overflow: "hidden",
                bgcolor: "#FFFFFF",
            }}
        >
            <Box
                sx={{
                    px: embedded ? 0 : { xs: 2, md: 2.5 },
                    py: embedded ? 0 : 2,
                    pb: embedded ? 1 : 2,
                    borderBottom: embedded ? 0 : "1px solid #E5E9F0",
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

            <TableContainer sx={embedded ? { border: "1px solid #D9E2EF", borderRadius: 1 } : undefined}>
                <Table sx={{ width: "100%", minWidth: 1080, tableLayout: "fixed" }}>
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
                                                multiline
                                                minRows={2}
                                                maxRows={4}
                                                error={Boolean(getPrescriptionTextError("dosage", detail.dosage))}
                                                helperText={getPrescriptionTextError("dosage", detail.dosage) || `${detail.dosage.length}/${PRESCRIPTION_TEXT_LIMITS.dosage} ký tự`}
                                                slotProps={{ htmlInput: { maxLength: PRESCRIPTION_TEXT_LIMITS.dosage, "aria-label": `Liều dùng ${medicine?.medicineName || index + 1}` } }}
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
                                                multiline
                                                minRows={2}
                                                maxRows={4}
                                                error={Boolean(getPrescriptionTextError("instructions", detail.instructions))}
                                                helperText={getPrescriptionTextError("instructions", detail.instructions) || `${detail.instructions.length}/${PRESCRIPTION_TEXT_LIMITS.instructions} ký tự`}
                                                slotProps={{ htmlInput: { maxLength: PRESCRIPTION_TEXT_LIMITS.instructions, "aria-label": `Hướng dẫn ${medicine?.medicineName || index + 1}` } }}
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
