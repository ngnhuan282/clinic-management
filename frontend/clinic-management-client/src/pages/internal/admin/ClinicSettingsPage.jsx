import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { getClinicSettings, updateClinicSettings } from "../../../api/publicApi";
import { validateClinicSettings } from "../../../data/publicContent";
import getApiErrorMessage from "../../../utils/errorHandler";

const BLUE = "#005DAC";

const cardSx = {
    borderRadius: 3,
    border: "1px solid #E5E9F0",
    boxShadow: "0 2px 8px rgba(23, 28, 31, 0.05)",
    backgroundColor: "#FFFFFF",
};

const toFormValues = data => ({
    clinicName: data?.clinicName ?? "",
    tagline: data?.tagline ?? "",
    description: data?.description ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    workingHours: data?.workingHours ?? "",
    primaryLocationName: data?.primaryLocationName ?? "",
    primaryLocationAddress: data?.primaryLocationAddress ?? "",
    secondaryLocationName: data?.secondaryLocationName ?? "",
    secondaryLocationAddress: data?.secondaryLocationAddress ?? "",
    defaultExaminationFee: String(data?.defaultExaminationFee ?? 150000),
    patientBookFee: String(data?.patientBookFee ?? 10000),
    defaultSlotDurationMinutes: String(data?.defaultSlotDurationMinutes ?? 30),
    defaultMaxPatientsPerSlot: String(data?.defaultMaxPatientsPerSlot ?? 1),
    lowStockThreshold: String(data?.lowStockThreshold ?? 10),
    nearExpiryDays: String(data?.nearExpiryDays ?? 30),
});

const formatCurrency = value =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0);

export default function ClinicSettingsPage() {
    const [saved, setSaved] = useState(null);
    const [form, setForm] = useState(() => toFormValues(null));
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [notice, setNotice] = useState("");
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let active = true;
        getClinicSettings()
            .then(result => {
                if (!active) return;
                setSaved(result);
                setForm(toFormValues(result));
                setFieldErrors({});
                setLoadError("");
            })
            .catch(err => {
                if (!active) return;
                setLoadError(getApiErrorMessage(err));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reloadToken]);

    const handleReload = useCallback(() => {
        setLoading(true);
        setLoadError("");
        setSaveError("");
        setNotice("");
        setReloadToken(value => value + 1);
    }, []);

    const handleResetToSaved = () => {
        if (!saved) return;
        setForm(toFormValues(saved));
        setFieldErrors({});
        setSaveError("");
        setNotice("");
    };

    const updateField = (name, value) => {
        setForm(current => ({ ...current, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(current => {
                const next = { ...current };
                delete next[name];
                return next;
            });
        }
        if (notice) setNotice("");
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setSaveError("");
        setNotice("");

        const errors = validateClinicSettings(form);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                clinicName: form.clinicName.trim(),
                tagline: form.tagline.trim(),
                description: form.description.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                workingHours: form.workingHours.trim(),
                primaryLocationName: form.primaryLocationName.trim(),
                primaryLocationAddress: form.primaryLocationAddress.trim(),
                secondaryLocationName: form.secondaryLocationName.trim() || null,
                secondaryLocationAddress: form.secondaryLocationAddress.trim() || null,
                defaultExaminationFee: Number(form.defaultExaminationFee),
                patientBookFee: Number(form.patientBookFee),
                defaultSlotDurationMinutes: Number(form.defaultSlotDurationMinutes),
                defaultMaxPatientsPerSlot: Number(form.defaultMaxPatientsPerSlot),
                lowStockThreshold: Number(form.lowStockThreshold),
                nearExpiryDays: Number(form.nearExpiryDays),
            };
            const updated = await updateClinicSettings(payload);
            setSaved(updated);
            setForm(toFormValues(updated));
            setFieldErrors({});
            setNotice("Đã lưu cấu hình phòng khám thành công.");
        } catch (err) {
            setSaveError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const updatedLabel = saved?.updatedAt
        ? new Date(saved.updatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
        : null;

    return (
        <Box sx={{ minHeight: "100%", backgroundColor: "#F6FAFE", p: { xs: 1, sm: 2, md: 3 } }}>
            <Stack spacing={3}>
                {/* Page Header */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75, flexWrap: "wrap" }}>
                            <Chip
                                icon={<SettingsOutlinedIcon sx={{ fontSize: 16 }} />}
                                label="Quản trị hệ thống"
                                size="small"
                                sx={{ bgcolor: "#EFF6FF", color: BLUE, fontWeight: 700 }}
                            />
                            {updatedLabel && (
                                <Typography variant="caption" color="text.secondary">
                                    Cập nhật gần nhất: {updatedLabel}
                                    {saved?.updatedByFullName ? ` · bởi ${saved.updatedByFullName}` : ""}
                                </Typography>
                            )}
                        </Stack>
                        <Typography
                            component="h1"
                            sx={{ color: "#1F2937", fontSize: { xs: 24, md: 30 }, fontWeight: 800, lineHeight: 1.25 }}
                        >
                            Cấu hình phòng khám
                        </Typography>
                        <Typography sx={{ color: "#6B7280", fontSize: 13.5, mt: 0.5 }}>
                            Quản lý thông tin công khai của phòng khám, giá khám mặc định, giá sổ khám và các tham số vận hành hệ thống.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<RefreshOutlinedIcon />}
                        disabled={loading || saving}
                        onClick={handleReload}
                        sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderColor: "#CBD5E1", bgcolor: "#FFFFFF", fontWeight: 700 }}
                    >
                        Làm mới dữ liệu
                    </Button>
                </Stack>

                {loadError && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={handleReload}>
                                Thử lại
                            </Button>
                        }
                    >
                        {loadError}
                    </Alert>
                )}

                {loading && !saved ? (
                    <Stack spacing={2.5}>
                        <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
                    </Stack>
                ) : saved ? (
                    <>
                        {/* Summary Metrics */}
                        <Grid container spacing={2}>
                            {[
                                [
                                    PaymentsOutlinedIcon,
                                    "Giá khám mặc định",
                                    formatCurrency(saved.defaultExaminationFee),
                                    "Áp dụng cho hàng chờ thu phí khám ban đầu",
                                ],
                                [
                                    PaymentsOutlinedIcon,
                                    "Giá sổ khám bệnh",
                                    formatCurrency(saved.patientBookFee),
                                    "Đơn giá mặc định khi cấp mới / cấp lại sổ",
                                ],
                                [
                                    ScheduleOutlinedIcon,
                                    "Tham số khung giờ khám",
                                    `${saved.defaultSlotDurationMinutes} phút / ca`,
                                    `Tối đa ${saved.defaultMaxPatientsPerSlot} bệnh nhân mỗi khung giờ`,
                                ],
                                [
                                    Inventory2OutlinedIcon,
                                    "Ngưỡng cảnh báo kho dược",
                                    `≤ ${saved.lowStockThreshold} đơn vị`,
                                    `Cảnh báo lô thuốc còn ≤ ${saved.nearExpiryDays} ngày hạn dùng`,
                                ],
                            ].map(([Icon, label, value, helper]) => (
                                <Grid key={label} size={{ xs: 12, sm: 6, xl: 3 }}>
                                    <Paper sx={{ ...cardSx, p: 2.5, height: "100%" }}>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ color: "#6B7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                                                    {label}
                                                </Typography>
                                                <Typography sx={{ color: "#111827", fontSize: 22, fontWeight: 800, mt: 0.75, fontVariantNumeric: "tabular-nums" }}>
                                                    {value}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 2.5,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: BLUE,
                                                    bgcolor: "#EFF6FF",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Icon fontSize="small" />
                                            </Box>
                                        </Stack>
                                        <Typography sx={{ color: "#6B7280", fontSize: 12.5, mt: 1.5 }}>
                                            {helper}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        {notice && (
                            <Alert severity="success" onClose={() => setNotice("")}>
                                {notice}
                            </Alert>
                        )}
                        {saveError && (
                            <Alert severity="error" onClose={() => setSaveError("")}>
                                {saveError}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Stack spacing={3}>
                                {/* Section 1: Public Clinic Information */}
                                <Paper sx={{ ...cardSx, p: { xs: 2.25, md: 3 } }}>
                                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                                        <BusinessOutlinedIcon sx={{ color: BLUE }} />
                                        <Box>
                                            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 17.5, color: "#1F2937" }}>
                                                Thông tin phòng khám công khai
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Hiển thị trên thanh điều hướng, chân trang, trang giới thiệu và liên hệ của cổng bệnh nhân.
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ mb: 2.5 }} />

                                    <Grid container spacing={2.25}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                label="Tên phòng khám"
                                                required
                                                fullWidth
                                                value={form.clinicName}
                                                onChange={e => updateField("clinicName", e.target.value)}
                                                error={Boolean(fieldErrors.clinicName)}
                                                helperText={fieldErrors.clinicName}
                                                slotProps={{ htmlInput: { maxLength: 150 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                label="Khẩu hiệu / Mô tả ngắn"
                                                required
                                                fullWidth
                                                value={form.tagline}
                                                onChange={e => updateField("tagline", e.target.value)}
                                                error={Boolean(fieldErrors.tagline)}
                                                helperText={fieldErrors.tagline}
                                                slotProps={{ htmlInput: { maxLength: 200 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                label="Giới thiệu phòng khám"
                                                required
                                                fullWidth
                                                multiline
                                                minRows={3}
                                                value={form.description}
                                                onChange={e => updateField("description", e.target.value)}
                                                error={Boolean(fieldErrors.description)}
                                                helperText={fieldErrors.description}
                                                slotProps={{ htmlInput: { maxLength: 600 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <TextField
                                                label="Tổng đài liên hệ"
                                                required
                                                fullWidth
                                                value={form.phone}
                                                onChange={e => updateField("phone", e.target.value)}
                                                error={Boolean(fieldErrors.phone)}
                                                helperText={fieldErrors.phone}
                                                slotProps={{ htmlInput: { maxLength: 30 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <TextField
                                                label="Email liên hệ"
                                                required
                                                fullWidth
                                                value={form.email}
                                                onChange={e => updateField("email", e.target.value)}
                                                error={Boolean(fieldErrors.email)}
                                                helperText={fieldErrors.email}
                                                slotProps={{ htmlInput: { maxLength: 100 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label="Giờ làm việc"
                                                required
                                                fullWidth
                                                value={form.workingHours}
                                                onChange={e => updateField("workingHours", e.target.value)}
                                                error={Boolean(fieldErrors.workingHours)}
                                                helperText={fieldErrors.workingHours}
                                                slotProps={{ htmlInput: { maxLength: 150 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 5 }}>
                                            <TextField
                                                label="Tên cơ sở chính"
                                                required
                                                fullWidth
                                                value={form.primaryLocationName}
                                                onChange={e => updateField("primaryLocationName", e.target.value)}
                                                error={Boolean(fieldErrors.primaryLocationName)}
                                                helperText={fieldErrors.primaryLocationName}
                                                slotProps={{ htmlInput: { maxLength: 150 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 7 }}>
                                            <TextField
                                                label="Địa chỉ cơ sở chính"
                                                required
                                                fullWidth
                                                value={form.primaryLocationAddress}
                                                onChange={e => updateField("primaryLocationAddress", e.target.value)}
                                                error={Boolean(fieldErrors.primaryLocationAddress)}
                                                helperText={fieldErrors.primaryLocationAddress}
                                                slotProps={{ htmlInput: { maxLength: 255 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 5 }}>
                                            <TextField
                                                label="Tên cơ sở phụ (tùy chọn)"
                                                fullWidth
                                                value={form.secondaryLocationName}
                                                onChange={e => updateField("secondaryLocationName", e.target.value)}
                                                error={Boolean(fieldErrors.secondaryLocationName)}
                                                helperText={fieldErrors.secondaryLocationName}
                                                slotProps={{ htmlInput: { maxLength: 150 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 7 }}>
                                            <TextField
                                                label="Địa chỉ cơ sở phụ (tùy chọn)"
                                                fullWidth
                                                value={form.secondaryLocationAddress}
                                                onChange={e => updateField("secondaryLocationAddress", e.target.value)}
                                                error={Boolean(fieldErrors.secondaryLocationAddress)}
                                                helperText={fieldErrors.secondaryLocationAddress}
                                                slotProps={{ htmlInput: { maxLength: 255 } }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Section 2: Default Fees & Operational Parameters */}
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Paper sx={{ ...cardSx, p: { xs: 2.25, md: 3 }, height: "100%" }}>
                                            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                                                <PaymentsOutlinedIcon sx={{ color: BLUE }} />
                                                <Box>
                                                    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 17.5, color: "#1F2937" }}>
                                                        Đơn giá dịch vụ cơ bản
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Áp dụng cho hàng chờ lập hóa đơn khám ban đầu, hóa đơn sổ khám và bảng giá công khai.
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Divider sx={{ mb: 2.5 }} />
                                            <Stack spacing={2.25}>
                                                <TextField
                                                    label="Giá khám mặc định (VNĐ)"
                                                    type="number"
                                                    required
                                                    fullWidth
                                                    value={form.defaultExaminationFee}
                                                    onChange={e => updateField("defaultExaminationFee", e.target.value)}
                                                    error={Boolean(fieldErrors.defaultExaminationFee)}
                                                    helperText={fieldErrors.defaultExaminationFee || "Áp dụng tự động cho khoản phí khám ban đầu chưa thu."}
                                                    slotProps={{ htmlInput: { min: 1000, step: 1000 } }}
                                                />
                                                <TextField
                                                    label="Giá sổ khám bệnh (VNĐ)"
                                                    type="number"
                                                    required
                                                    fullWidth
                                                    value={form.patientBookFee}
                                                    onChange={e => updateField("patientBookFee", e.target.value)}
                                                    error={Boolean(fieldErrors.patientBookFee)}
                                                    helperText={fieldErrors.patientBookFee || "Áp dụng khi tạo hóa đơn mua sổ mới hoặc cấp lại sổ khám."}
                                                    slotProps={{ htmlInput: { min: 1000, step: 1000 } }}
                                                />
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Paper sx={{ ...cardSx, p: { xs: 2.25, md: 3 }, height: "100%" }}>
                                            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                                                <ScheduleOutlinedIcon sx={{ color: BLUE }} />
                                                <Box>
                                                    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 17.5, color: "#1F2937" }}>
                                                        Tham số vận hành hệ thống
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Điều chỉnh khung giờ khi duyệt ca khám và ngưỡng cảnh báo tồn kho dược phẩm.
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Divider sx={{ mb: 2.5 }} />
                                            <Grid container spacing={2.25}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        select
                                                        label="Thời lượng khung giờ khám"
                                                        required
                                                        fullWidth
                                                        value={form.defaultSlotDurationMinutes}
                                                        onChange={e => updateField("defaultSlotDurationMinutes", e.target.value)}
                                                        error={Boolean(fieldErrors.defaultSlotDurationMinutes)}
                                                        helperText={fieldErrors.defaultSlotDurationMinutes}
                                                    >
                                                        {[15, 20, 30].map(minutes => (
                                                            <MenuItem key={minutes} value={String(minutes)}>
                                                                {minutes} phút
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        label="Số BN tối đa / khung giờ"
                                                        type="number"
                                                        required
                                                        fullWidth
                                                        value={form.defaultMaxPatientsPerSlot}
                                                        onChange={e => updateField("defaultMaxPatientsPerSlot", e.target.value)}
                                                        error={Boolean(fieldErrors.defaultMaxPatientsPerSlot)}
                                                        helperText={fieldErrors.defaultMaxPatientsPerSlot}
                                                        slotProps={{ htmlInput: { min: 1, max: 20, step: 1 } }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        label="Ngưỡng cảnh báo sắp hết hàng"
                                                        type="number"
                                                        required
                                                        fullWidth
                                                        value={form.lowStockThreshold}
                                                        onChange={e => updateField("lowStockThreshold", e.target.value)}
                                                        error={Boolean(fieldErrors.lowStockThreshold)}
                                                        helperText={fieldErrors.lowStockThreshold}
                                                        slotProps={{ htmlInput: { min: 1, max: 10000, step: 1 } }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        label="Số ngày cảnh báo gần hết hạn"
                                                        type="number"
                                                        required
                                                        fullWidth
                                                        value={form.nearExpiryDays}
                                                        onChange={e => updateField("nearExpiryDays", e.target.value)}
                                                        error={Boolean(fieldErrors.nearExpiryDays)}
                                                        helperText={fieldErrors.nearExpiryDays}
                                                        slotProps={{ htmlInput: { min: 1, max: 365, step: 1 } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Action Buttons */}
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    sx={{ justifyContent: "flex-end" }}
                                >
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={<RestoreOutlinedIcon />}
                                        disabled={saving}
                                        onClick={handleResetToSaved}
                                        sx={{ borderColor: "#CBD5E1", bgcolor: "#FFFFFF", fontWeight: 700 }}
                                    >
                                        Khôi phục đang lưu
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveOutlinedIcon />}
                                        disabled={saving}
                                        sx={{
                                            backgroundColor: BLUE,
                                            fontWeight: 800,
                                            px: 3,
                                            "&:hover": { backgroundColor: "#1565C0" },
                                        }}
                                    >
                                        {saving ? "Đang lưu..." : "Lưu cấu hình"}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    </>
                ) : null}
            </Stack>
        </Box>
    );
}
