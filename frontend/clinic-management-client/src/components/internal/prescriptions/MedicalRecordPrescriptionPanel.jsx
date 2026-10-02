import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import formatCurrency from "../../../utils/formatCurrency";
import { getPrescriptionStockStatusConfig } from "./prescriptionStockStatus";

function SummaryItem({ label, value, color = "#1F2937" }) {
    return (
        <Stack direction="row" spacing={1.5} justifyContent="space-between">
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function MedicalRecordPrescriptionPanel({
    prescription,
    loading = false,
    error = "",
    onOpen,
}) {
    const hasPrescription = Boolean(prescription);
    const hasWarnings = (prescription?.stockWarningCount || 0) > 0;
    const previewDetails = prescription?.details?.slice(0, 3) || [];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                bgcolor: "#FFFFFF",
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 1.5,
                            color: "#005DAC",
                            bgcolor: "#EFF6FF",
                        }}
                    >
                        <LocalPharmacyOutlinedIcon fontSize="small" />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{ color: "#1F2937", fontWeight: 900 }}
                        >
                            Đơn thuốc
                        </Typography>
                    </Box>

                    {hasPrescription && (
                        <Chip
                            size="small"
                            label={prescription.prescriptionCode}
                            sx={{
                                color: "#005DAC",
                                bgcolor: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                fontWeight: 900,
                            }}
                        />
                    )}
                </Stack>

                {loading && (
                    <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                    >
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                            Đang tải đơn thuốc...
                        </Typography>
                    </Stack>
                )}

                {!loading && error && (
                    <Typography
                        variant="body2"
                        sx={{ color: "#DC2626", lineHeight: 1.6 }}
                    >
                        {error}
                    </Typography>
                )}

                {!loading && !error && !hasPrescription && (
                    <Typography
                        variant="body2"
                        sx={{ color: "#6B7280", lineHeight: 1.6 }}
                    >
                        Hồ sơ này chưa có đơn thuốc.
                    </Typography>
                )}

                {!loading && !error && hasPrescription && (
                    <>
                        <Stack spacing={1.25}>
                            <SummaryItem
                                label="Số thuốc"
                                value={`${prescription.totalItems} loại`}
                            />
                            <SummaryItem
                                label="Tổng số lượng"
                                value={prescription.totalQuantity}
                            />
                            <SummaryItem
                                label="Cảnh báo tồn"
                                value={prescription.stockWarningCount}
                                color={hasWarnings ? "#DC2626" : "#059669"}
                            />
                            <SummaryItem
                                label="Dự tính chi phí"
                                value={formatCurrency(
                                    prescription.estimatedTotalAmount
                                )}
                                color="#005DAC"
                            />
                        </Stack>

                        {previewDetails.length > 0 && (
                            <>
                                <Divider />

                                <Stack spacing={1}>
                                    {previewDetails.map((detail) => {
                                        const status =
                                            getPrescriptionStockStatusConfig(
                                                detail.stockStatus
                                            );

                                        return (
                                            <Box
                                                key={
                                                    detail.prescriptionDetailId
                                                }
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: 1.5,
                                                    border:
                                                        "1px solid #E5E9F0",
                                                    bgcolor: "#F8FAFC",
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="flex-start"
                                                >
                                                    <Box
                                                        sx={{
                                                            minWidth: 0,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color:
                                                                    "#111827",
                                                                fontWeight: 900,
                                                                lineHeight:
                                                                    1.45,
                                                            }}
                                                        >
                                                            {
                                                                detail.medicineName
                                                            }
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {detail.quantity}{" "}
                                                            {detail.unit} ·{" "}
                                                            {detail.dosage}
                                                        </Typography>
                                                    </Box>

                                                    {detail.stockStatus !==
                                                        "Available" && (
                                                        <WarningAmberOutlinedIcon
                                                            fontSize="small"
                                                            sx={{
                                                                color:
                                                                    status.color,
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </>
                        )}
                    </>
                )}

                <Button
                    variant={hasPrescription ? "outlined" : "contained"}
                    startIcon={<LocalPharmacyOutlinedIcon />}
                    onClick={onOpen}
                    sx={{ minHeight: 42, fontWeight: 800 }}
                >
                    {hasPrescription ? "Xem / chỉnh sửa đơn" : "Kê đơn thuốc"}
                </Button>
            </Stack>
        </Paper>
    );
}

export default MedicalRecordPrescriptionPanel;
