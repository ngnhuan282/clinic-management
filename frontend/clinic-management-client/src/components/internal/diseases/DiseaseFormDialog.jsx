import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

const EMPTY_FORM = {
    diseaseCode: "",
    diseaseName: "",
    description: "",
    isActive: true,
};

function getInitialForm(disease) {
    if (!disease) {
        return EMPTY_FORM;
    }

    return {
        diseaseCode: disease.diseaseCode || "",
        diseaseName: disease.diseaseName || "",
        description: disease.description || "",
        isActive: Boolean(disease.isActive),
    };
}

function DiseaseFormDialog({
    open,
    disease,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() => getInitialForm(disease));
    const [error, setError] = useState("");

    const isEditing = Boolean(disease);

    useEffect(() => {
        if (open) {
            setForm(getInitialForm(disease));
            setError("");
        }
    }, [disease, open]);

    const handleChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleActiveChange = (event) => {
        setForm((current) => ({
            ...current,
            isActive: event.target.checked,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.diseaseCode.trim()) {
            setError("Vui lòng nhập mã bệnh.");
            return;
        }

        if (!form.diseaseName.trim()) {
            setError("Vui lòng nhập tên bệnh.");
            return;
        }

        const payload = {
            diseaseCode: form.diseaseCode.trim(),
            diseaseName: form.diseaseName.trim(),
            description: form.description.trim() || null,
        };

        if (isEditing) {
            payload.isActive = form.isActive;
        }

        try {
            await onSubmit(
                payload,
                disease?.diseaseId || null
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
                        <MedicalInformationOutlinedIcon />
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
                                ? "Cập nhật bệnh"
                                : "Thêm bệnh mới"}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                color: "#64748B",
                            }}
                        >
                            Chuẩn hóa mã bệnh để bác sĩ chọn chẩn
                            đoán thống nhất trong hồ sơ bệnh án.
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
                    severity="info"
                    sx={{
                        mt: 1,
                        mb: 2,
                        alignItems: "center",
                        borderRadius: 1.5,
                        border: "1px solid #BFDBFE",
                        color: "#1D4ED8",
                        backgroundColor: "#EFF6FF",
                        "& .MuiAlert-icon": {
                            color: "#2563EB",
                        },
                    }}
                >
                    Danh mục này sẽ xuất hiện trong dropdown chẩn
                    đoán ở trang lập hồ sơ bệnh án.
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
                    id="disease-form"
                    onSubmit={handleSubmit}
                >
                    <Stack spacing={2}>
                        <TextField
                            label="Mã bệnh"
                            value={form.diseaseCode}
                            onChange={handleChange("diseaseCode")}
                            fullWidth
                            required
                            placeholder="VD: I10, E11, J06..."
                            inputProps={{ maxLength: 32 }}
                        />

                        <TextField
                            label="Tên bệnh"
                            value={form.diseaseName}
                            onChange={handleChange("diseaseName")}
                            fullWidth
                            required
                            placeholder="VD: Tăng huyết áp, Đái tháo đường type 2..."
                            inputProps={{ maxLength: 160 }}
                        />

                        <TextField
                            label="Mô tả / ghi chú"
                            value={form.description}
                            onChange={handleChange("description")}
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="Nhập phạm vi áp dụng hoặc ghi chú chuyên môn nếu cần..."
                            inputProps={{ maxLength: 500 }}
                        />

                        {isEditing && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isActive}
                                        onChange={handleActiveChange}
                                    />
                                }
                                label={
                                    form.isActive
                                        ? "Đang áp dụng"
                                        : "Tạm ngưng"
                                }
                                sx={{
                                    m: 0,
                                    color: "#374151",
                                    "& .MuiFormControlLabel-label": {
                                        fontWeight: 700,
                                    },
                                }}
                            />
                        )}
                    </Stack>
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
                    form="disease-form"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={saving}
                    sx={{ minWidth: 144 }}
                >
                    {saving ? "Đang lưu..." : "Lưu bệnh"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DiseaseFormDialog;
