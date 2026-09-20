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
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

const EMPTY_FORM = {
    categoryName: "",
};

function MedicineCategoryFormDialog({
    open,
    category,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() => category ? {
                categoryName: category.categoryName || "",
            } : EMPTY_FORM);
    const [error, setError] = useState("");

    const isEditing = Boolean(category);


    const handleChange = (event) => {
        setForm({
            categoryName: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.categoryName.trim()) {
            setError("Vui lòng nhập tên danh mục thuốc.");
            return;
        }

        try {
            await onSubmit(
                {
                    categoryName: form.categoryName.trim(),
                },
                category?.categoryId || null
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
                        <CategoryOutlinedIcon />
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
                                ? "Cập nhật danh mục thuốc"
                                : "Thêm danh mục thuốc mới"}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                color: "#64748B",
                            }}
                        >
                            Chuẩn hóa nhóm thuốc để dùng thống nhất
                            trong danh mục thuốc và kê đơn.
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
                    <strong>Chuẩn hóa danh mục:</strong> Danh mục sau
                    khi lưu sẽ xuất hiện trong form thêm thuốc.
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
                    id="medicine-category-form"
                    onSubmit={handleSubmit}
                >
                    <TextField
                        label="Tên danh mục thuốc"
                        value={form.categoryName}
                        onChange={handleChange}
                        fullWidth
                        required
                        placeholder="VD: Kháng sinh, Giảm đau - Hạ sốt..."
                        inputProps={{ maxLength: 100 }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 1.5,
                                backgroundColor: "#FFFFFF",
                            },
                        }}
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
                    form="medicine-category-form"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={saving}
                    sx={{ minWidth: 160 }}
                >
                    {saving ? "Đang lưu..." : "Lưu danh mục"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MedicineCategoryFormDialog;
