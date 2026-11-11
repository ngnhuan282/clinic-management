import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    Link,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    CalendarMonthOutlined,
    CheckCircleOutlined,
    RefreshOutlined,
    ShieldOutlined,
} from "@mui/icons-material";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import { createGuestAppointment } from "../../api/publicApi";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import usePublicResource from "../../hooks/usePublicResource";
import { CLINIC } from "../../data/publicContent";
import { clinicToday, validateGuestBooking } from "../../utils/publicBooking";
import getApiErrorMessage from "../../utils/errorHandler";

const sectionSx = {
    p: { xs: 2.75, md: 3.5 },
    borderRadius: "16px",
    borderColor: "#e5e9f0",
    bgcolor: "#ffffff",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
};

const time = value => String(value || "").slice(0, 5);
const dateLabel = value => value?.split("T")[0].split("-").reverse().join("/");

export default function GuestBookingPage() {
    const [params] = useSearchParams();
    const [values, setValues] = useState(() => ({
        departmentId: params.get("departmentId") || "",
        doctorId: params.get("doctorId") || "",
        date: params.get("date") >= clinicToday() ? params.get("date") : clinicToday(),
        startTime: "",
        patientName: "",
        patientPhone: "",
        reason: "",
        consent: false,
    }));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [receipt]);

    const submitting = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const departments = usePublicResource(getDepartments);
    const loadDoctors = useCallback(
        () => (values.departmentId ? getDoctorsByDepartment(values.departmentId) : Promise.resolve([])),
        [values.departmentId]
    );
    const doctors = usePublicResource(loadDoctors);
    const loadSlots = useCallback(
        () =>
            values.doctorId && values.date >= clinicToday()
                ? getAvailableSlots(values.doctorId, values.date)
                : Promise.resolve([]),
        [values.doctorId, values.date]
    );
    const slots = usePublicResource(loadSlots);

    const department = departments.data?.find(item => String(item.departmentId) === values.departmentId);
    const doctor = doctors.data?.find(item => String(item.doctorId) === values.doctorId);
    const available = slots.data?.filter(item => item.isAvailable) || [];
    const selectedSlot = available.find(item => item.startTime === values.startTime);
    const ready = Boolean(department && doctor && selectedSlot && !busy);

    const update = (name, value) => {
        setValues(current => ({
            ...current,
            [name]: value,
            ...(name === "departmentId" ? { doctorId: "", startTime: "" } : {}),
            ...(["doctorId", "date"].includes(name) ? { startTime: "" } : {}),
        }));
        setErrors(current => ({ ...current, [name]: undefined }));
        setError("");
    };

    const field = name => ({
        value: values[name],
        onChange: e => update(name, e.target.value),
        error: Boolean(errors[name]),
        helperText: errors[name],
        fullWidth: true,
        disabled: busy,
    });

    const review = event => {
        event.preventDefault();
        const validation = validateGuestBooking(values);
        if (!department) validation.departmentId = "Vui lòng chọn chuyên khoa đang hoạt động.";
        if (!doctor) validation.doctorId = "Vui lòng chọn bác sĩ trong chuyên khoa.";
        if (!selectedSlot) validation.startTime = "Vui lòng chọn giờ khám còn trống.";
        setErrors(validation);
        if (Object.keys(validation).length) {
            document.getElementById(`guest-${Object.keys(validation)[0]}`)?.focus();
            return;
        }
        setConfirming(true);
    };

    const submit = async () => {
        if (submitting.current || !ready) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        try {
            const result = await createGuestAppointment({
                doctorId: Number(values.doctorId),
                appointmentDate: values.date,
                startTime: values.startTime,
                patientName: values.patientName.trim(),
                patientPhone: values.patientPhone.trim(),
                reason: values.reason.trim(),
            });
            if (!mounted.current) return;
            setReceipt(result);
            setConfirming(false);
            setValues(current => ({
                ...current,
                patientName: "",
                patientPhone: "",
                reason: "",
                consent: false,
                startTime: "",
            }));
        } catch (apiError) {
            if (!mounted.current) return;
            setConfirming(false);
            update("startTime", "");
            setError(getApiErrorMessage(apiError));
            slots.retry();
        } finally {
            submitting.current = false;
            if (mounted.current) setBusy(false);
        }
    };

    // Receipt View
    if (receipt) {
        return (
            <PublicPage title="Đăng ký lịch khám thành công">
                <Paper
                    variant="outlined"
                    sx={{
                        ...sectionSx,
                        maxWidth: 780,
                        mx: "auto",
                        p: { xs: 3, md: 5 },
                        borderTop: "4px solid #10b981",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                bgcolor: "#ecfdf5",
                                color: "#10b981",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <CheckCircleOutlined sx={{ fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography component="h2" variant="h5" sx={{ fontWeight: 800, color: "#065f46" }}>
                                Đã tiếp nhận đăng ký khám
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Lịch hẹn đang ở trạng thái chờ xác nhận. Phòng khám sẽ liên hệ qua điện thoại để hỗ trợ bạn.
                            </Typography>
                        </Box>
                    </Box>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                            bgcolor: "#f8fafc",
                            borderRadius: "12px",
                            borderColor: "#e2e8f0",
                            mb: 3,
                        }}
                    >
                        <Stack spacing={2}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
                                    MÃ SỐ LỊCH HẸN
                                </Typography>
                                <Typography sx={{ fontSize: 20, fontWeight: 800, color: "primary.main", letterSpacing: "0.05em" }}>
                                    #{receipt.appointmentId}
                                </Typography>
                            </Box>
                            <Divider sx={{ borderColor: "#e5e9f0" }} />
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Bác sĩ tiếp nhận</Typography>
                                    <Typography sx={{ fontWeight: 650, color: "#1f2937" }}>{receipt.doctorName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Chuyên khoa</Typography>
                                    <Typography sx={{ fontWeight: 650, color: "#1f2937" }}>{receipt.departmentName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Ngày khám</Typography>
                                    <Typography sx={{ fontWeight: 650, color: "#1f2937" }}>{dateLabel(receipt.appointmentDate)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Khung giờ</Typography>
                                    <Typography sx={{ fontWeight: 650, color: "#1f2937" }}>{time(receipt.startTime)} – {time(receipt.endTime)}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>

                    <Chip
                        label="Chờ lễ tân xác nhận"
                        color="warning"
                        sx={{ fontWeight: 700, borderRadius: "6px", mb: 3 }}
                    />

                    <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.8, mb: 4 }}>
                        Vui lòng lưu lại mã số lịch hẹn trên. Khi cần điều chỉnh hoặc hủy lịch, vui lòng gọi đến tổng đài{" "}
                        <Link href={CLINIC.phoneHref} sx={{ fontWeight: 700 }}>{CLINIC.phone}</Link> và cung cấp mã này. Lịch hẹn của khách không tự động gắn vào tài khoản tạo sau đó.
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="outlined"
                            size="large"
                            sx={{ borderRadius: "10px", fontWeight: 650, textTransform: "none" }}
                        >
                            Về trang chủ
                        </Button>
                        <Button
                            onClick={() => {
                                setReceipt(null);
                                slots.retry();
                            }}
                            variant="contained"
                            size="large"
                            sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
                        >
                            Đăng ký lịch hẹn khác
                        </Button>
                    </Stack>
                </Paper>
            </PublicPage>
        );
    }

    return (
        <PublicPage
            title="Đăng ký lịch khám trực tuyến"
            description="Lựa chọn bác sĩ và khung giờ còn trống thuận tiện nhất. Bạn có thể đăng ký ngay mà không bắt buộc phải có tài khoản."
        >
            {/* Login Suggestion Banner */}
            <Alert
                severity="info"
                icon={<ShieldOutlined />}
                sx={{
                    mb: 4,
                    borderRadius: "14px",
                    bgcolor: "#eff6ff",
                    borderColor: "#bfdbfe",
                    border: "1px solid",
                    color: "#1e3a8a",
                }}
            >
                Đã có tài khoản?{" "}
                <Link
                    component={RouterLink}
                    to="/login"
                    state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}
                    sx={{ fontWeight: 700 }}
                >
                    Đăng nhập
                </Link>{" "}
                hoặc{" "}
                <Link
                    component={RouterLink}
                    to="/register"
                    state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}
                    sx={{ fontWeight: 700 }}
                >
                    đăng ký tài khoản
                </Link>{" "}
                để dễ dàng theo dõi lịch sử khám, đơn thuốc và kết quả xét nghiệm trực tuyến.
            </Alert>

            <Box component="form" onSubmit={review} noValidate aria-busy={busy}>
                <Grid container spacing={3.5}>
                    {/* Left Form: 3 Steps */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3.5}>
                            {/* Step 1: Specialty & Doctor */}
                            <Paper variant="outlined" sx={sectionSx}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "grid",
                                            placeItems: "center",
                                            fontWeight: 800,
                                            fontSize: 14,
                                        }}
                                    >
                                        1
                                    </Box>
                                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 18, color: "#0f2c4d" }}>
                                        Chọn Chuyên khoa & Bác sĩ
                                    </Typography>
                                </Box>

                                <Stack spacing={2.5}>
                                    <ResourceState resource={departments}>
                                        <TextField
                                            id="guest-departmentId"
                                            select
                                            label="Chuyên khoa khám"
                                            required
                                            {...field("departmentId")}
                                            value={department ? values.departmentId : ""}
                                            helperText={errors.departmentId || "Lựa chọn chuyên khoa phù hợp với nhu cầu khám của bạn"}
                                        >
                                            <MenuItem value="">-- Chọn chuyên khoa --</MenuItem>
                                            {departments.data?.map(item => (
                                                <MenuItem key={item.departmentId} value={String(item.departmentId)}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </ResourceState>

                                    {departments.status === "ready" && !departments.data?.length && (
                                        <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                            Chưa có chuyên khoa đang nhận đăng ký.
                                        </Alert>
                                    )}

                                    <ResourceState resource={doctors}>
                                        <TextField
                                            id="guest-doctorId"
                                            select
                                            label="Bác sĩ tiếp nhận"
                                            required
                                            {...field("doctorId")}
                                            value={doctor ? values.doctorId : ""}
                                            disabled={!department || busy}
                                            helperText={errors.doctorId || (!department ? "Vui lòng chọn chuyên khoa trước" : "Chọn bác sĩ trong danh sách")}
                                        >
                                            <MenuItem value="">-- Chọn bác sĩ --</MenuItem>
                                            {doctors.data?.map(item => (
                                                <MenuItem key={item.doctorId} value={String(item.doctorId)}>
                                                    {item.title} {item.fullName}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </ResourceState>

                                    {department && doctors.status === "ready" && !doctors.data?.length && (
                                        <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                            Chuyên khoa hiện chưa có bác sĩ nhận đăng ký trực tuyến.
                                        </Alert>
                                    )}

                                    {doctor && (
                                        <Box>
                                            <Button
                                                component={RouterLink}
                                                to={`/doctors/${doctor.doctorId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="small"
                                                sx={{ textTransform: "none", fontWeight: 600 }}
                                            >
                                                Xem hồ sơ & kinh nghiệm của bác sĩ {doctor.fullName} ↗
                                            </Button>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Step 2: Date & Slot */}
                            <Paper variant="outlined" sx={sectionSx}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "grid",
                                            placeItems: "center",
                                            fontWeight: 800,
                                            fontSize: 14,
                                        }}
                                    >
                                        2
                                    </Box>
                                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 18, color: "#0f2c4d" }}>
                                        Ngày & Khung giờ khám
                                    </Typography>
                                </Box>

                                <Stack spacing={2.5}>
                                    <TextField
                                        id="guest-date"
                                        label="Ngày khám dự kiến"
                                        type="date"
                                        required
                                        {...field("date")}
                                        slotProps={{
                                            inputLabel: { shrink: true },
                                            htmlInput: { min: clinicToday() },
                                        }}
                                        helperText="Giờ khám theo múi giờ Việt Nam (UTC+7)"
                                    />

                                    {doctor && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#1f2937" }}>
                                                Khung giờ khám còn trống:
                                            </Typography>
                                            <ResourceState resource={slots}>
                                                {slots.data?.length ? (
                                                    <Box
                                                        role="group"
                                                        aria-label="Giờ khám còn trống"
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                                            gap: 1.25,
                                                        }}
                                                    >
                                                        {slots.data.map(slot => {
                                                            const isSelected = values.startTime === slot.startTime;
                                                            return (
                                                                <Button
                                                                    id={slot.startTime === available[0]?.startTime ? "guest-startTime" : undefined}
                                                                    key={slot.startTime}
                                                                    disabled={!slot.isAvailable || busy}
                                                                    variant={isSelected ? "contained" : "outlined"}
                                                                    aria-pressed={isSelected}
                                                                    onClick={() => update("startTime", slot.startTime)}
                                                                    sx={{
                                                                        minHeight: 44,
                                                                        borderRadius: "8px",
                                                                        fontWeight: 700,
                                                                        fontSize: 14,
                                                                        textTransform: "none",
                                                                        borderColor: slot.isAvailable ? (isSelected ? "primary.main" : "#90caf9") : "#e2e8f0",
                                                                        bgcolor: isSelected ? "primary.main" : slot.isAvailable ? "#f0fdf4" : "#f3f4f6",
                                                                        color: isSelected ? "#ffffff" : slot.isAvailable ? "#166534" : "#94a3b8",
                                                                        boxShadow: isSelected ? "0 2px 8px rgba(25, 118, 210, 0.3)" : "none",
                                                                        "&:hover": {
                                                                            bgcolor: isSelected ? "primary.dark" : "#dcfce7",
                                                                        },
                                                                    }}
                                                                >
                                                                    {time(slot.startTime)}
                                                                </Button>
                                                            );
                                                        })}
                                                    </Box>
                                                ) : (
                                                    <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                                        Chưa có giờ khám trong ngày này. Hãy chọn ngày khác hoặc bác sĩ khác.
                                                    </Alert>
                                                )}

                                                {slots.data?.length > 0 && !available.length && (
                                                    <Alert severity="warning" sx={{ mt: 2, borderRadius: "10px" }}>
                                                        Tất cả các khung giờ khám trong ngày đã kín. Vui lòng chọn ngày khác.
                                                    </Alert>
                                                )}
                                            </ResourceState>

                                            <Button
                                                onClick={() => {
                                                    update("startTime", "");
                                                    slots.retry();
                                                }}
                                                disabled={busy || slots.status === "loading"}
                                                startIcon={<RefreshOutlined />}
                                                size="small"
                                                sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
                                            >
                                                Làm mới giờ trống
                                            </Button>
                                        </Box>
                                    )}

                                    {errors.startTime && (
                                        <Typography role="alert" color="error" sx={{ fontSize: 13, fontWeight: 500 }}>
                                            {errors.startTime}
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Step 3: Patient Information */}
                            <Paper variant="outlined" sx={sectionSx}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "grid",
                                            placeItems: "center",
                                            fontWeight: 800,
                                            fontSize: 14,
                                        }}
                                    >
                                        3
                                    </Box>
                                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 18, color: "#0f2c4d" }}>
                                        Thông tin người khám
                                    </Typography>
                                </Box>

                                <Stack spacing={2.5}>
                                    <TextField
                                        id="guest-patientName"
                                        label="Họ và tên người khám"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        autoComplete="name"
                                        required
                                        {...field("patientName")}
                                        slotProps={{ htmlInput: { maxLength: 100 } }}
                                    />

                                    <TextField
                                        id="guest-patientPhone"
                                        label="Số điện thoại liên hệ"
                                        placeholder="Ví dụ: 0912345678"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        {...field("patientPhone")}
                                        slotProps={{ htmlInput: { maxLength: 15 } }}
                                        helperText={errors.patientPhone || "Phòng khám sẽ gọi vào số này để xác nhận lịch hẹn"}
                                    />

                                    <TextField
                                        id="guest-reason"
                                        label="Triệu chứng hoặc lý do khám"
                                        placeholder="Mô tả ngắn gọn lý do hoặc các biểu hiện bất thường gần đây..."
                                        multiline
                                        minRows={3}
                                        required
                                        {...field("reason")}
                                        slotProps={{ htmlInput: { maxLength: 500 } }}
                                    />

                                    <Box sx={{ pt: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    id="guest-consent"
                                                    checked={values.consent}
                                                    onChange={e => update("consent", e.target.checked)}
                                                    disabled={busy}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ fontSize: 13.5, lineHeight: 1.6, color: "#374151" }}>
                                                    Tôi xác nhận thông tin cung cấp là chính xác và đồng ý để phòng khám liên hệ qua điện thoại xác nhận lịch khám.{" "}
                                                    <Link component={RouterLink} to="/privacy" underline="hover">
                                                        Chính sách bảo mật
                                                    </Link>
                                                </Typography>
                                            }
                                        />
                                        {errors.consent && (
                                            <Typography color="error" role="alert" sx={{ fontSize: 13, mt: 0.5, pl: 4 }}>
                                                {errors.consent}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Summary Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                ...sectionSx,
                                position: { md: "sticky" },
                                top: 96,
                                bgcolor: "#ffffff",
                                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
                            }}
                        >
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: 17.5, color: "#0f2c4d", mb: 2 }}>
                                Tóm tắt đăng ký
                            </Typography>

                            <Stack spacing={2}>
                                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <Stack spacing={1.25}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Chuyên khoa</Typography>
                                            <Typography sx={{ fontWeight: 650, color: "#1f2937", fontSize: 14 }}>
                                                {department?.name || <Box component="span" sx={{ color: "#94a3b8" }}>Chưa chọn</Box>}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#edf2f7" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Bác sĩ</Typography>
                                            <Typography sx={{ fontWeight: 650, color: "#1f2937", fontSize: 14 }}>
                                                {doctor?.fullName || <Box component="span" sx={{ color: "#94a3b8" }}>Chưa chọn</Box>}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#edf2f7" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Ngày khám</Typography>
                                            <Typography sx={{ fontWeight: 650, color: "#1f2937", fontSize: 14 }}>
                                                {dateLabel(values.date) || <Box component="span" sx={{ color: "#94a3b8" }}>Chưa chọn</Box>}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#edf2f7" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Giờ khám dự kiến</Typography>
                                            <Typography sx={{ fontWeight: 650, color: "primary.main", fontSize: 15 }}>
                                                {selectedSlot ? time(selectedSlot.startTime) : <Box component="span" sx={{ color: "#94a3b8" }}>Chưa chọn</Box>}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Alert severity="info" sx={{ borderRadius: "10px", fontSize: 12.5, lineHeight: 1.5 }}>
                                    Lịch đăng ký sẽ ở trạng thái <strong>Chờ xác nhận</strong>. Lễ tân sẽ liên hệ xác nhận giờ khám qua số điện thoại của bạn.
                                </Alert>

                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: "10px", fontSize: 13 }}>
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={
                                        busy ||
                                        departments.status !== "ready" ||
                                        doctors.status !== "ready" ||
                                        slots.status !== "ready"
                                    }
                                    sx={{
                                        borderRadius: "10px",
                                        py: 1.35,
                                        fontWeight: 750,
                                        fontSize: 15,
                                        textTransform: "none",
                                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.25)",
                                    }}
                                >
                                    Kiểm tra thông tin đăng ký
                                </Button>

                                <Box sx={{ textAlign: "center", pt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Cần hỗ trợ? Gọi tổng đài:{" "}
                                        <Link href={CLINIC.phoneHref} sx={{ fontWeight: 700 }}>
                                            {CLINIC.phone}
                                        </Link>
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Confirmation Modal */}
            <Dialog
                open={confirming}
                onClose={() => !busy && setConfirming(false)}
                fullWidth
                maxWidth="sm"
                aria-labelledby="guest-confirm-title"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "16px",
                            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
                        },
                    },
                }}
            >
                <DialogTitle id="guest-confirm-title" sx={{ fontWeight: 800, fontSize: 19, color: "#0f2c4d", pt: 3 }}>
                    Xác nhận thông tin đăng ký khám
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "12px", bgcolor: "#f8fafc", borderColor: "#e2e8f0" }}>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Người khám:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{values.patientName}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{values.patientPhone}</Typography>
                                </Box>
                                <Divider sx={{ borderColor: "#edf2f7" }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Chuyên khoa:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{department?.name}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Bác sĩ:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{doctor?.title} {doctor?.fullName}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Thời gian khám:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                                        {time(values.startTime)} · Ngày {dateLabel(values.date)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ borderColor: "#edf2f7" }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                        Lý do khám:
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#374151" }}>
                                        {values.reason}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Alert severity="info" sx={{ borderRadius: "10px", fontSize: 13 }}>
                            Vui lòng kiểm tra kỹ số điện thoại để nhân viên lễ tân có thể liên hệ xác nhận lịch khám.
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submit}
                        disabled={!ready}
                        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CalendarMonthOutlined />}
                        sx={{ borderRadius: "8px", px: 3, fontWeight: 700, textTransform: "none" }}
                    >
                        {busy ? "Đang gửi đăng ký..." : "Gửi đăng ký khám"}
                    </Button>
                </DialogActions>
            </Dialog>
        </PublicPage>
    );
}
