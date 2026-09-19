import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MedicationLiquidOutlinedIcon from "@mui/icons-material/MedicationLiquidOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

const EMPTY_FORM = {
    medicineName: "",
    categoryId: "",
    supplierId: "",
    unit: "",
    unitPrice: "",
    description: "",
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

function MedicineFormDialog({
    open,
    medicine,
    categories,
    suppliers,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");

    const isEditing = Boolean(medicine);

    const categoryOptions = useMemo(
        () => categories || [],
        [categories]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setError("");

        if (medicine) {
            setForm({
                medicineName: medicine.medicineName || "",
                categoryId: medicine.categoryId || "",
                supplierId: medicine.supplierId || "",
                unit: medicine.unit || "",
                unitPrice: medicine.unitPrice ?? "",
                description: medicine.description || "",
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [open, medicine]);

    const handleChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.medicineName.trim()) {
            setError("Vui lòng nhập tên thuốc.");
            return;
        }

        if (!form.categoryId) {
            setError("Vui lòng chọn danh mục thuốc.");
            return;
        }

        if (!form.unit.trim()) {
            setError("Vui lòng nhập đơn vị tính.");
            return;
        }

        if (Number(form.unitPrice) < 0) {
            setError("Giá bán không được âm.");
            return;
        }

        const payload = {
            medicineName: form.medicineName.trim(),
            categoryId: Number(form.categoryId),
            supplierId: form.supplierId
                ? Number(form.supplierId)
                : null,
            unit: form.unit.trim(),
            unitPrice: Number(form.unitPrice || 0),
            description: form.description.trim() || null,
        };

        try {
            await onSubmit(payload, medicine?.medicineId || null);
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
            maxWidth="lg"
            PaperProps={{
                sx: {
                    width: "min(1040px, calc(100vw - 32px))",
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
                    spacing={3}
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
                            mr: 1.5,
                        }}
                    >
                        <MedicationLiquidOutlinedIcon />
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
                                ? "Cập nhật thuốc & dược phẩm"
                                : "Thêm thuốc & dược phẩm mới"}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                color: "#64748B",
                            }}
                        >
                            Nhập thông tin định danh, đơn vị tính,
                            giá bán và nhà cung cấp theo dữ liệu
                            hiện có của hệ thống.
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
                    sx={{
                        mt: 1,
                        mb: 1.25,
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
                    <strong>Chuẩn hóa danh mục thuốc:</strong>{" "}
                    Dữ liệu thuốc sau khi lưu sẽ được dùng cho kê đơn
                    và đối chiếu tồn kho. Vui lòng kiểm tra kỹ tên
                    thuốc, danh mục và đơn vị tính.
                </Alert>

                {categoryOptions.length === 0 && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2.25,
                            borderRadius: 1.5,
                        }}
                    >
                        Chưa có danh mục thuốc. Hãy tạo danh mục
                        trước khi thêm thuốc.
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
                    id="medicine-form"
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
                            title="Thông tin định danh thuốc"
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
                                label="Tên biệt dược / Tên thương mại"
                                value={form.medicineName}
                                onChange={handleChange(
                                    "medicineName"
                                )}
                                fullWidth
                                required
                                placeholder="VD: Panadol Extra, Augmentin 1g..."
                                inputProps={{ maxLength: 150 }}
                                sx={fieldSx}
                            />

                            <TextField
                                label="Mã thuốc hệ thống"
                                value={
                                    medicine?.medicineCode ||
                                    "Tự sinh khi lưu"
                                }
                                fullWidth
                                disabled
                                sx={fieldSx}
                            />

                            <TextField
                                select
                                label="Danh mục thuốc"
                                value={form.categoryId}
                                onChange={handleChange("categoryId")}
                                fullWidth
                                required
                                sx={fieldSx}
                            >
                                {categoryOptions.map((category) => (
                                    <MenuItem
                                        key={category.categoryId}
                                        value={category.categoryId}
                                    >
                                        {category.categoryName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>

                    <Box>
                        <SectionTitle
                            icon={Inventory2OutlinedIcon}
                            number="2"
                            title="Quy cách đóng gói & chính sách giá"
                        />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(2, minmax(0, 1fr))",
                                },
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <TextField
                                label="Đơn vị tính"
                                value={form.unit}
                                onChange={handleChange("unit")}
                                fullWidth
                                required
                                placeholder="Viên, hộp, chai..."
                                inputProps={{ maxLength: 20 }}
                                sx={fieldSx}
                            />

                            <TextField
                                label="Giá bán niêm yết"
                                type="number"
                                value={form.unitPrice}
                                onChange={handleChange("unitPrice")}
                                fullWidth
                                inputProps={{
                                    min: 0,
                                    step: 1000,
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            VNĐ
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Box>
                    </Box>

                    <Box>
                        <SectionTitle
                            icon={BusinessOutlinedIcon}
                            number="3"
                            title="Nhà cung ứng & hướng dẫn"
                        />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(2, minmax(0, 1fr))",
                                },
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <TextField
                                select
                                label="Nhà cung cấp mặc định"
                                value={form.supplierId}
                                onChange={handleChange("supplierId")}
                                fullWidth
                                sx={fieldSx}
                            >
                                <MenuItem value="">Không chọn</MenuItem>
                                {suppliers.map((supplier) => (
                                    <MenuItem
                                        key={supplier.supplierId}
                                        value={supplier.supplierId}
                                    >
                                        {supplier.supplierName}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Mô tả / Ghi chú"
                                value={form.description}
                                onChange={handleChange("description")}
                                fullWidth
                                multiline
                                minRows={3}
                                placeholder="VD: Dùng sau bữa ăn, lưu ý khi kê đơn..."
                                inputProps={{ maxLength: 255 }}
                                sx={{
                                    ...fieldSx,
                                    gridColumn: {
                                        md: "span 2",
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
                    justifyContent: "space-between",
                    borderTop: "1px solid #E5E9F0",
                    backgroundColor: "#F8FAFC",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                        display: { xs: "none", sm: "flex" },
                        color: "#64748B",
                    }}
                >
                    <HelpOutlineOutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                        Cần hỗ trợ mã hóa?
                    </Typography>
                    <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ fontWeight: 700 }}
                    >
                        Xem chuẩn BYT
                    </Link>
                </Stack>

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
                            "&.Mui-focusVisible": {
                                outline: "2px solid rgba(0, 93, 172, 0.22)",
                                outlineOffset: 2,
                            },
                        }}
                    >
                        Hủy bỏ
                    </Button>

                    <Button
                        type="submit"
                        form="medicine-form"
                        variant="contained"
                        startIcon={<SaveOutlinedIcon />}
                        disabled={
                            saving ||
                            categoryOptions.length === 0
                        }
                        sx={{ minWidth: 176 }}
                    >
                        {saving
                            ? "Đang lưu..."
                            : "Lưu thông tin thuốc"}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

export default MedicineFormDialog;
