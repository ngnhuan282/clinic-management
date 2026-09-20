import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

const EMPTY_FORM = {
    supplierName: "",
    contactInfo: "",
    address: "",
};

function SupplierFormDialog({
    open,
    supplier,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() => supplier ? {
                supplierName: supplier.supplierName || "",
                contactInfo: supplier.contactInfo || "",
                address: supplier.address || "",
            } : EMPTY_FORM);
    const [error, setError] = useState("");

    const isEditing = Boolean(supplier);


    const handleChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.supplierName.trim()) {
            setError("Vui lòng nhập tên nhà cung cấp.");
            return;
        }

        try {
            await onSubmit(
                {
                    supplierName: form.supplierName.trim(),
                    contactInfo:
                        form.contactInfo.trim() || null,
                    address: form.address.trim() || null,
                },
                supplier?.supplierId || null
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
            maxWidth="sm"
            PaperProps={{
                sx: {
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
                    spacing={2}
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
                        <StorefrontOutlinedIcon />
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
                                ? "Cập nhật nhà cung cấp"
                                : "Thêm nhà cung cấp mới"}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                color: "#64748B",
                            }}
                        >
                            Lưu thông tin nhà cung cấp để liên kết
                            với danh mục thuốc và chuẩn bị dữ liệu
                            nhập kho.
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
                    pb: 3,
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Alert
                    severity="warning"
                    sx={{
                        mt: 1,
                        mb: 2,
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
                    <strong>Chuẩn hóa nhà cung cấp:</strong> Nhà cung
                    cấp sau khi lưu sẽ xuất hiện trong form thêm
                    thuốc.
                </Alert>

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
                    id="supplier-form"
                    onSubmit={handleSubmit}
                    sx={{
                        display: "grid",
                        gap: 2,
                    }}
                >
                    <TextField
                        label="Tên nhà cung cấp"
                        value={form.supplierName}
                        onChange={handleChange("supplierName")}
                        fullWidth
                        required
                        placeholder="VD: Dược Hậu Giang, Sanofi..."
                        inputProps={{ maxLength: 150 }}
                    />

                    <TextField
                        label="Thông tin liên hệ"
                        value={form.contactInfo}
                        onChange={handleChange("contactInfo")}
                        fullWidth
                        placeholder="VD: 028.3899.999 - contact@ncc.vn"
                        inputProps={{ maxLength: 100 }}
                    />

                    <TextField
                        label="Địa chỉ"
                        value={form.address}
                        onChange={handleChange("address")}
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Địa chỉ kho, văn phòng hoặc ghi chú liên hệ"
                        inputProps={{ maxLength: 255 }}
                    />
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: "1px solid #E5E9F0",
                    backgroundColor: "#F8FAFC",
                }}
            >
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
                    form="supplier-form"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={saving}
                    sx={{ minWidth: 176 }}
                >
                    {saving ? "Đang lưu..." : "Lưu nhà cung cấp"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SupplierFormDialog;
