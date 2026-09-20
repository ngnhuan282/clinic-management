import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const EMPTY_FORM = {
    medicineId: "",
    batchNumber: "",
    quantityInStock: "",
    expiryDate: "",
};

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 1.5,
        backgroundColor: "#FFFFFF",
    },
};

function SectionTitle({ icon: Icon, number, title }) {
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
                pt: 1,
                pb: 1.25,
                borderBottom: "1px solid #E5E9F0",
            }}
        >
            <Icon
                sx={{
                    fontSize: 18,
                    color: "#005DAC",
                }}
            />

            <Typography
                variant="subtitle2"
                sx={{
                    color: "#64748B",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                }}
            >
                {number}. {title}
            </Typography>
        </Stack>
    );
}

function InventoryFormDialog({
    open,
    inventoryItem,
    medicines,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() => inventoryItem ? {
                medicineId: inventoryItem.medicineId || "",
                batchNumber: inventoryItem.batchNumber || "",
                quantityInStock:
                    inventoryItem.quantityInStock ?? "",
                expiryDate: inventoryItem.expiryDate || "",
            } : EMPTY_FORM);
    const [error, setError] = useState("");

    const isEditing = Boolean(inventoryItem);

    const selectedMedicine = useMemo(
        () =>
            medicines.find(
                (medicine) =>
                    medicine.medicineId ===
                    Number(form.medicineId)
            ),
        [form.medicineId, medicines]
    );


    const handleChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.medicineId) {
            setError("Vui lòng chọn thuốc.");
            return;
        }

        if (!form.batchNumber.trim()) {
            setError("Vui lòng nhập số lô.");
            return;
        }

        if (Number(form.quantityInStock) < 0) {
            setError("Số lượng tồn không được âm.");
            return;
        }

        if (!form.expiryDate) {
            setError("Vui lòng chọn hạn dùng.");
            return;
        }

        const payload = {
            medicineId: Number(form.medicineId),
            batchNumber: form.batchNumber.trim(),
            quantityInStock: Number(form.quantityInStock || 0),
            expiryDate: form.expiryDate,
        };

        try {
            await onSubmit(
                payload,
                inventoryItem?.inventoryId || null
            );
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    width: "min(880px, calc(100vw - 32px))",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    boxShadow:
                        "0 24px 48px rgba(15, 23, 42, 0.22)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2.25,
                    borderBottom: "1px solid #E5E9F0",
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2.25}
                    sx={{ width: "100%" }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            color: "#005DAC",
                            backgroundColor: "#EFF6FF",
                        }}
                    >
                        <Inventory2OutlinedIcon />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                color: "#1F2937",
                                fontWeight: 800,
                                lineHeight: 1.2,
                            }}
                        >
                            {isEditing
                                ? "Cập nhật lô tồn kho"
                                : "Thêm lô tồn kho nền"}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                color: "#64748B",
                            }}
                        >
                            Quản lý số lô, số lượng tồn và hạn dùng để
                            phục vụ cảnh báo kê đơn theo nguyên tắc FEFO.
                        </Typography>
                    </Box>

                    <IconButton
                        aria-label="Đóng"
                        onClick={onClose}
                        disabled={saving}
                        sx={{
                            flexShrink: 0,
                            ml: "auto",
                            mr: -1,
                            color: "#94A3B8",
                            "&:hover": {
                                color: "#475569",
                                backgroundColor: "#F1F5F9",
                            },
                        }}
                    >
                        <CloseOutlinedIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    pt: 3.5,
                    pb: 2.5,
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Alert
                    severity="warning"
                    icon={<WarningAmberOutlinedIcon />}
                    sx={{
                        mt: 1,
                        mb: 2.25,
                        alignItems: "center",
                        borderRadius: 1.5,
                        border: "1px solid #FDE68A",
                        color: "#92400E",
                        backgroundColor: "#FFFBEB",
                        "& .MuiAlert-icon": {
                            color: "#D97706",
                        },
                    }}
                >
                    <strong>Inventory nền:</strong> dữ liệu này dùng để
                    kiểm tra khả năng đáp ứng tồn kho khi kê đơn. Nghiệp vụ
                    nhập kho theo PO và cấp thuốc trừ kho sẽ làm ở các task
                    sau.
                </Alert>

                {medicines.length === 0 && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2.25,
                            borderRadius: 1.5,
                        }}
                    >
                        Chưa có thuốc. Hãy tạo thuốc trước khi thêm lô tồn
                        kho.
                    </Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            borderRadius: 1.5,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    id="inventory-form"
                    onSubmit={handleSubmit}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                    }}
                >
                    <Box>
                        <SectionTitle
                            icon={VerifiedOutlinedIcon}
                            number="1"
                            title="Thông tin thuốc"
                        />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "2fr 1fr",
                                },
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <TextField
                                select
                                label="Thuốc"
                                value={form.medicineId}
                                onChange={handleChange("medicineId")}
                                fullWidth
                                required
                                sx={fieldSx}
                            >
                                {medicines.map((medicine) => (
                                    <MenuItem
                                        key={medicine.medicineId}
                                        value={medicine.medicineId}
                                    >
                                        {medicine.medicineCode} -{" "}
                                        {medicine.medicineName}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Đơn vị tính"
                                value={selectedMedicine?.unit || ""}
                                fullWidth
                                disabled
                                sx={fieldSx}
                            />

                            <TextField
                                label="Danh mục"
                                value={
                                    selectedMedicine?.categoryName || ""
                                }
                                fullWidth
                                disabled
                                sx={fieldSx}
                            />

                            <TextField
                                label="Nhà cung cấp mặc định"
                                value={
                                    selectedMedicine?.supplierName ||
                                    "Chưa chọn"
                                }
                                fullWidth
                                disabled
                                sx={fieldSx}
                            />
                        </Box>
                    </Box>

                    <Box>
                        <SectionTitle
                            icon={Inventory2OutlinedIcon}
                            number="2"
                            title="Số lô & hạn dùng"
                        />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <TextField
                                label="Số lô / Batch number"
                                value={form.batchNumber}
                                onChange={handleChange("batchNumber")}
                                fullWidth
                                required
                                placeholder="VD: LOT-AUG-2401"
                                inputProps={{ maxLength: 50 }}
                                sx={fieldSx}
                            />

                            <TextField
                                label="Số lượng tồn"
                                type="number"
                                value={form.quantityInStock}
                                onChange={handleChange(
                                    "quantityInStock"
                                )}
                                fullWidth
                                inputProps={{
                                    min: 0,
                                    step: 1,
                                }}
                                sx={fieldSx}
                            />

                            <TextField
                                label="Hạn dùng"
                                type="date"
                                value={form.expiryDate}
                                onChange={handleChange("expiryDate")}
                                fullWidth
                                required
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    ...fieldSx,
                                    "& input[type='date']": {
                                        color: form.expiryDate
                                            ? "#1F2937"
                                            : "transparent",
                                        caretColor: "#1F2937",
                                    },
                                    "& input[type='date']::-webkit-datetime-edit":
                                        {
                                            color: form.expiryDate
                                                ? "#1F2937"
                                                : "transparent",
                                        },
                                    "& input[type='date']:focus::-webkit-datetime-edit":
                                        {
                                            color: "#1F2937",
                                        },
                                    "& input[type='date']::-webkit-calendar-picker-indicator":
                                        {
                                            cursor: "pointer",
                                            opacity: 1,
                                        },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    justifyContent: "flex-end",
                    borderTop: "1px solid #E5E9F0",
                    backgroundColor: "#F8FAFC",
                }}
            >
                <Stack direction="row" spacing={1.5}>
                    <Button
                        onClick={onClose}
                        disabled={saving}
                        variant="outlined"
                        sx={{
                            minWidth: 96,
                            borderColor: "#D6DADE",
                            color: "#1F2937",
                            backgroundColor: "#FFFFFF",
                            "&:hover": {
                                borderColor: "#005DAC",
                                color: "#005DAC",
                                backgroundColor: "#EFF6FF",
                            },
                        }}
                    >
                        Hủy bỏ
                    </Button>

                    <Button
                        type="submit"
                        form="inventory-form"
                        variant="contained"
                        startIcon={<SaveOutlinedIcon />}
                        disabled={saving || medicines.length === 0}
                        sx={{ minWidth: 176 }}
                    >
                        {saving
                            ? "Đang lưu..."
                            : "Lưu lô tồn kho"}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

export default InventoryFormDialog;
