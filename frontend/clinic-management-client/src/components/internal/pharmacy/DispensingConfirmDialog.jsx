import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";

import formatDate from "../../../utils/formatDate";

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

function MetadataSeparator() {
    return (
        <Box
            component="span"
            aria-hidden="true"
            sx={{ width: 10, height: 20, display: "grid", placeItems: "center", flexShrink: 0 }}
        >
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#94A3B8" }} />
        </Box>
    );
}

function DispensingConfirmDialog({ open, detail, loading, onCancel, onConfirm }) {
    const [checked, setChecked] = useState(false);

    if (!detail) return null;

    const totalQuantity = detail.medicines.reduce(
        (total, medicine) => total + medicine.quantityPrescribed,
        0
    );

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onCancel}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        maxHeight: "calc(100vh - 48px)",
                        borderRadius: 2,
                    },
                },
            }}
        >
            <DialogTitle sx={{ p: 2.5, borderBottom: "1px solid #E5E9F0" }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "42px minmax(0, 1fr) 36px",
                        alignItems: "start",
                        columnGap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            display: "grid",
                            placeItems: "center",
                            color: "#005DAC",
                            backgroundColor: "#EFF6FF",
                            borderRadius: 1.5,
                        }}
                    >
                        <MedicationOutlinedIcon />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" component="div" sx={{ color: "#111827", fontWeight: 900, lineHeight: 1.3 }}>
                            Xác nhận giao thuốc
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            flexWrap="wrap"
                            alignItems="center"
                            sx={{ mt: 0.75 }}
                        >
                            <Typography variant="body2" sx={{ color: "#005DAC", fontWeight: 900 }}>
                                {detail.prescriptionCode}
                            </Typography>
                            <MetadataSeparator />
                            <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700 }}>
                                {detail.patientName}
                            </Typography>
                            <MetadataSeparator />
                            <Typography variant="caption" color="text.secondary">
                                {detail.medicines.length} loại · {totalQuantity} đơn vị
                            </Typography>
                        </Stack>
                    </Box>

                    <IconButton
                        size="small"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Đóng xác nhận"
                        sx={{
                            width: 36,
                            height: 36,
                            color: "#64748B",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            "&:hover": { color: "#111827", backgroundColor: "#F1F5F9" },
                        }}
                    >
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, pt: "22px !important", pb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                    <Inventory2OutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ color: "#111827", fontWeight: 900 }}>
                        Phân bổ lô xuất theo FEFO
                    </Typography>
                </Stack>

                <Stack spacing={1.25}>
                    {detail.medicines.map((medicine) => {
                        const unit = formatUnit(medicine.unit);

                        return (
                            <Box
                                key={medicine.prescriptionDetailId}
                                sx={{ overflow: "hidden", border: "1px solid #E5E9F0", borderRadius: 1.5 }}
                            >
                                <Box
                                    sx={{
                                        px: 1.75,
                                        py: 1.25,
                                        display: "grid",
                                        gridTemplateColumns: "minmax(0, 1fr) auto",
                                        alignItems: "center",
                                        gap: 1.5,
                                        backgroundColor: "#F8FAFC",
                                        borderBottom: "1px solid #E5E9F0",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: "#111827", fontWeight: 900 }}>
                                        {medicine.medicineName}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={`${medicine.quantityPrescribed} ${unit}`}
                                        sx={{ color: "#1D4ED8", backgroundColor: "#EFF6FF", fontWeight: 900 }}
                                    />
                                </Box>

                                {medicine.allocations.map((lot, index) => (
                                    <Box
                                        key={lot.inventoryId}
                                        sx={{
                                            px: 1.75,
                                            py: 1.1,
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0, 1fr) auto",
                                            alignItems: "center",
                                            columnGap: 2,
                                            borderTop: index > 0 ? "1px solid #EEF2F6" : 0,
                                            backgroundColor: "#FFFFFF",
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={{ xs: 0.25, sm: 1.5 }}
                                            useFlexGap
                                            sx={{ minWidth: 0 }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{ color: "#334155", fontWeight: 900, overflowWrap: "anywhere" }}
                                            >
                                                Lô {lot.batchNumber}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                                                HSD {formatDate(lot.expiryDate)}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: "#005DAC", fontWeight: 900 }}>
                                            {lot.quantityAllocated} {unit}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        );
                    })}
                </Stack>

                <Alert severity="warning" sx={{ mt: 2, alignItems: "flex-start" }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        Tồn kho sẽ được cập nhật ngay
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, lineHeight: 1.55 }}>
                        Số lượng của các lô trên sẽ bị trừ sau khi xác nhận. Thao tác này không thể thực hiện lần hai.
                    </Typography>
                </Alert>

                <Box
                    sx={{
                        mt: 1.5,
                        px: 1.25,
                        py: 0.5,
                        border: checked ? "1px solid #93C5FD" : "1px solid #E5E9F0",
                        borderRadius: 1.5,
                        backgroundColor: checked ? "#EFF6FF" : "#FFFFFF",
                    }}
                >
                    <FormControlLabel
                        sx={{ m: 0, width: "100%", alignItems: "center" }}
                        control={
                            <Checkbox
                                checked={checked}
                                onChange={(event) => setChecked(event.target.checked)}
                                disabled={loading}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.5 }}>
                                Đã đối chiếu đúng bệnh nhân, thuốc, số lượng và các lô sẽ giao.
                            </Typography>
                        }
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 2, gap: 1, borderTop: "1px solid #E5E9F0" }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackOutlinedIcon />}
                    onClick={onCancel}
                    disabled={loading}
                    sx={{ minHeight: 40, fontWeight: 800 }}
                >
                    Quay lại
                </Button>
                <Button
                    variant="contained"
                    startIcon={<CheckCircleOutlineOutlinedIcon />}
                    onClick={onConfirm}
                    disabled={!checked || loading}
                    sx={{ minHeight: 40, fontWeight: 900 }}
                >
                    {loading ? "Đang xác nhận..." : "Giao thuốc và trừ kho"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DispensingConfirmDialog;
