import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";

import Loading from "../../common/Loading";
import formatDate from "../../../utils/formatDate";
import { getDispensingStatusConfig } from "./dispensingStatus";

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function formatUnit(value) {
    const units = {
        vien: "viên",
        binh: "bình",
        goi: "gói",
        hop: "hộp",
        but: "bút",
    };

    return units[value?.trim()?.toLowerCase()] || value || "đơn vị";
}

function InfoField({ label, value, secondary }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    color: "#64748B",
                    fontSize: 10.5,
                    fontWeight: 900,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ mt: 0.35, color: "#111827", fontWeight: 800, lineHeight: 1.45, overflowWrap: "anywhere" }}
            >
                {value}
            </Typography>
            {secondary && (
                <Typography variant="caption" sx={{ mt: 0.2, display: "block", color: "#047857", fontWeight: 800 }}>
                    {secondary}
                </Typography>
            )}
        </Box>
    );
}

function EmptyDetailPanel() {
    return (
        <Box
            sx={{
                width: "100%",
                minHeight: { xs: 360, lg: 540 },
                flex: 1,
                px: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 310,
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr)",
                    justifyItems: "center",
                    alignItems: "center",
                    rowGap: 1.25,
                }}
            >
                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        m: "0 !important",
                        display: "grid",
                        placeItems: "center",
                        justifySelf: "center",
                        color: "#005DAC",
                        backgroundColor: "#EFF6FF",
                        borderRadius: 1.5,
                    }}
                >
                    <MedicationOutlinedIcon />
                </Box>
                <Typography sx={{ color: "#111827", fontWeight: 900 }}>
                    Chọn một đơn thuốc
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6 }}>
                    Thông tin bệnh nhân và phân bổ lô FEFO sẽ hiển thị tại đây.
                </Typography>
            </Box>
        </Box>
    );
}

function DispensingDetailPanel({ selected, detail, loading, onClose, onConfirm }) {
    const status = detail ? getDispensingStatusConfig(detail.workflowStatus) : null;
    const initial = detail?.patientName?.trim()?.slice(0, 1) || "BN";

    return (
        <Paper
            elevation={0}
            sx={{
                minWidth: 0,
                overflow: "hidden",
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                backgroundColor: "#FFFFFF",
                position: { lg: "sticky" },
                top: { lg: 16 },
                maxHeight: { lg: "calc(100vh - 32px)" },
                display: "flex",
                flexDirection: "column",
            }}
        >
            {!selected ? (
                <EmptyDetailPanel />
            ) : (
                <>
                    <Box sx={{ px: 2.25, py: 2, borderBottom: "1px solid #E5E9F0", flexShrink: 0 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 34px", columnGap: 1.5 }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="caption"
                                    sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}
                                >
                                    Chi tiết cấp thuốc
                                </Typography>
                                {detail && (
                                    <Stack
                                        direction="row"
                                        spacing={0.75}
                                        useFlexGap
                                        flexWrap="wrap"
                                        alignItems="center"
                                        sx={{ mt: 0.55 }}
                                    >
                                        <Typography sx={{ color: "#005DAC", fontWeight: 900, lineHeight: 1.3 }}>
                                            {detail.prescriptionCode}
                                        </Typography>
                                        <Chip
                                            label={status.label}
                                            size="small"
                                            sx={{
                                                color: status.color,
                                                backgroundColor: status.backgroundColor,
                                                border: `1px solid ${status.borderColor}`,
                                                fontWeight: 800,
                                            }}
                                        />
                                    </Stack>
                                )}
                                {detail && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                        Kê ngày {formatDate(detail.prescriptionDate)}
                                    </Typography>
                                )}
                            </Box>

                            <IconButton
                                size="small"
                                onClick={onClose}
                                aria-label="Đóng chi tiết"
                                sx={{
                                    width: 34,
                                    height: 34,
                                    color: "#64748B",
                                    backgroundColor: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    "&:hover": { color: "#111827", backgroundColor: "#F1F5F9" },
                                }}
                            >
                                <CloseOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 2.25 }}>
                        {loading || !detail ? (
                            <Loading />
                        ) : (
                            <Stack spacing={2}>
                                <Box sx={{ overflow: "hidden", border: "1px solid #E5E9F0", borderRadius: 1.5, backgroundColor: "#F8FAFC" }}>
                                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1.75, py: 1.5 }}>
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: "#1E63B6", fontWeight: 900 }}>
                                            {initial.toLocaleUpperCase("vi-VN")}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ color: "#111827", fontWeight: 900, lineHeight: 1.35 }}>
                                                {detail.patientName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                                                {detail.patientPhone || "Chưa có số điện thoại"}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Box
                                        sx={{
                                            px: 1.75,
                                            py: 1.5,
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                            gap: 1.75,
                                            borderTop: "1px solid #E5E9F0",
                                            backgroundColor: "#FFFFFF",
                                        }}
                                    >
                                        <InfoField label="Bác sĩ kê đơn" value={detail.doctorName} />
                                        <InfoField
                                            label="Hóa đơn"
                                            value={detail.invoiceId
                                                ? `HD-${String(detail.invoiceId).padStart(5, "0")}`
                                                : "Chưa có hóa đơn"}
                                            secondary={detail.invoiceId ? "Đã thanh toán" : null}
                                        />
                                        {detail.dispensedAt && (
                                            <InfoField label="Đã giao lúc" value={formatDateTime(detail.dispensedAt)} />
                                        )}
                                        {detail.dispensedByName && (
                                            <InfoField label="Dược sĩ giao" value={detail.dispensedByName} />
                                        )}
                                    </Box>
                                </Box>

                                <Box>
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                        <Inventory2OutlinedIcon color="primary" fontSize="small" />
                                        <Typography sx={{ color: "#111827", fontWeight: 900 }}>
                                            Thuốc và phân bổ lô
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={detail.medicines.length}
                                            sx={{ color: "#1D4ED8", backgroundColor: "#EFF6FF", fontWeight: 900 }}
                                        />
                                    </Stack>

                                    <Stack spacing={1.25}>
                                        {detail.medicines.map((medicine) => {
                                            const allocated = medicine.allocations.reduce(
                                                (total, lot) => total + lot.quantityAllocated,
                                                0
                                            );
                                            const unit = formatUnit(medicine.unit);

                                            return (
                                                <Box
                                                    key={medicine.prescriptionDetailId}
                                                    sx={{
                                                        overflow: "hidden",
                                                        border: "1px solid #E5E9F0",
                                                        borderRadius: 1.5,
                                                        backgroundColor: medicine.isFulfillable ? "#FFFFFF" : "#FFFBEB",
                                                    }}
                                                >
                                                    <Box sx={{ px: 1.5, py: 1.25 }}>
                                                        <Box
                                                            sx={{
                                                                width: "100%",
                                                                display: "grid",
                                                                gridTemplateColumns: "minmax(0, 1fr) auto",
                                                                alignItems: "start",
                                                                columnGap: 2,
                                                            }}
                                                        >
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography variant="body2" sx={{ color: "#111827", fontWeight: 900 }}>
                                                                    {medicine.medicineName}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {medicine.medicineCode}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                size="small"
                                                                label={`${medicine.quantityPrescribed} ${unit}`}
                                                                sx={{ flexShrink: 0, color: "#1D4ED8", backgroundColor: "#EFF6FF", fontWeight: 900 }}
                                                            />
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                mt: 1.1,
                                                                display: "grid",
                                                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                                                gap: 1.25,
                                                            }}
                                                        >
                                                            <InfoField label="Liều dùng" value={medicine.dosage || "Chưa ghi"} />
                                                            <InfoField label="Hướng dẫn" value={medicine.instructions || "Chưa ghi"} />
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ borderTop: "1px solid #E5E9F0" }}>
                                                        <Box
                                                            sx={{
                                                                px: 1.5,
                                                                py: 0.8,
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                                backgroundColor: "#F8FAFC",
                                                            }}
                                                        >
                                                            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>
                                                                Phân bổ lô FEFO
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: "#334155", fontWeight: 900 }}>
                                                                {allocated}/{medicine.quantityPrescribed} {unit}
                                                            </Typography>
                                                        </Box>

                                                        {medicine.allocations.map((lot) => (
                                                            <Box
                                                                key={lot.inventoryId}
                                                                sx={{
                                                                    px: 1.5,
                                                                    py: 0.9,
                                                                    display: "grid",
                                                                    gridTemplateColumns: "minmax(0, 1fr) auto",
                                                                    alignItems: "center",
                                                                    gap: 1.5,
                                                                    borderTop: "1px solid #EEF2F6",
                                                                    backgroundColor: "#FFFFFF",
                                                                }}
                                                            >
                                                                <Stack direction="row" spacing={1.25} useFlexGap sx={{ minWidth: 0 }}>
                                                                    <Typography variant="caption" sx={{ color: "#334155", fontWeight: 900, overflowWrap: "anywhere" }}>
                                                                        Lô {lot.batchNumber}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: "#64748B", flexShrink: 0 }}>
                                                                        HSD {formatDate(lot.expiryDate)}
                                                                    </Typography>
                                                                </Stack>
                                                                <Typography variant="caption" sx={{ color: "#005DAC", fontWeight: 900 }}>
                                                                    {lot.quantityAllocated} {unit}
                                                                </Typography>
                                                            </Box>
                                                        ))}

                                                        {medicine.allocations.length === 0 && (
                                                            <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid #FECACA", backgroundColor: "#FEF2F2" }}>
                                                                <Typography variant="caption" sx={{ color: "#B91C1C", fontWeight: 800 }}>
                                                                    Không có lô còn hạn để phân bổ.
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {!medicine.isFulfillable && (
                                                        <Typography variant="caption" sx={{ px: 1.5, py: 1, display: "block", color: "#B91C1C", fontWeight: 800 }}>
                                                            Thiếu {Math.max(medicine.quantityPrescribed - allocated, 0)} {unit}; tồn còn hạn hiện có {medicine.quantityAvailable}.
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>

                                {detail.notes && (
                                    <Box sx={{ px: 1.75, py: 1.5, border: "1px solid #E5E9F0", borderRadius: 1.5, backgroundColor: "#F8FAFC" }}>
                                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 900 }}>
                                            Lời dặn bác sĩ
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.45, color: "#334155", lineHeight: 1.6 }}>
                                            {detail.notes}
                                        </Typography>
                                    </Box>
                                )}

                                {detail.workflowStatus === "AwaitingPayment" && (
                                    <Alert severity="warning">
                                        Chỉ được giao thuốc sau khi hóa đơn thuốc hoặc hóa đơn cuối đã thanh toán.
                                    </Alert>
                                )}
                                {!detail.hasSufficientStock && detail.workflowStatus !== "Dispensed" && (
                                    <Alert severity="error">Tồn kho còn hạn chưa đủ để cấp toàn bộ đơn thuốc.</Alert>
                                )}
                                {detail.workflowStatus === "Dispensed" && (
                                    <Alert severity="success" icon={<CheckCircleOutlineOutlinedIcon />}>
                                        Đơn thuốc đã được giao và trừ kho.
                                    </Alert>
                                )}
                            </Stack>
                        )}
                    </Box>

                    {detail && detail.workflowStatus !== "Dispensed" && (
                        <Box sx={{ p: 2, borderTop: "1px solid #E5E9F0", backgroundColor: "#FFFFFF", flexShrink: 0 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<CheckCircleOutlineOutlinedIcon />}
                                disabled={!detail.canDispense || loading}
                                onClick={onConfirm}
                                sx={{ minHeight: 42, fontWeight: 900 }}
                            >
                                {detail.workflowStatus === "AwaitingPayment"
                                    ? "Chờ thanh toán"
                                    : "Xác nhận giao thuốc"}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
}

export default DispensingDetailPanel;
