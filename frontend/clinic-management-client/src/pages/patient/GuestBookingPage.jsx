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
    AccessTimeOutlined,
    CalendarMonthOutlined,
    CheckCircleOutlined,
    LocalHospitalOutlined,
    PersonOutlineOutlined,
    RadioButtonUncheckedOutlined,
    RefreshOutlined,
    ShieldOutlined,
} from "@mui/icons-material";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import { createGuestAppointment, useClinicInfo } from "../../api/publicApi";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import usePublicResource from "../../hooks/usePublicResource";
import { clinicToday, validateGuestBooking } from "../../utils/publicBooking";
import getApiErrorMessage from "../../utils/errorHandler";

const sectionSx = {
    p: { xs: 2.25, md: 3.25 },
    borderRadius: "16px",
    borderColor: "#C5D8EC",
    bgcolor: "#FFFFFF",
    boxShadow: "0 2px 10px rgba(10, 37, 64, 0.04)",
};

function activeCardSx(active, done) {
    if (active) {
        return {
            borderColor: "#0B4F8A",
            borderLeft: "4px solid #0B4F8A",
            boxShadow: "0 6px 20px rgba(11, 79, 138, 0.10)",
        };
    }
    if (done) {
        return {
            borderColor: "#A7F3D0",
            borderLeft: "4px solid #059669",
        };
    }
    return {};
}

const time = value => String(value || "").slice(0, 5);
const dateLabel = value => value?.split("T")[0].split("-").reverse().join("/");
const money = value =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export default function GuestBookingPage() {
    const clinic = useClinicInfo();
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
            <PublicPage badge="Phiếu tiếp nhận trực tuyến" title="Đăng ký lịch khám thành công">
                <Paper
                    variant="outlined"
                    sx={{
                        ...sectionSx,
                        maxWidth: 780,
                        mx: "auto",
                        p: { xs: 3, md: 5 },
                        borderTop: "5px solid #0B4F8A",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 3 }}>
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "12px",
                                bgcolor: "#ECFDF5",
                                color: "#065F46",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <CheckCircleOutlined sx={{ fontSize: 32 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography component="h2" variant="h5" sx={{ fontWeight: 800, color: "#0A2540" }}>
                                Đã tiếp nhận đăng ký khám
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.35, color: "#334155" }}>
                                Lịch hẹn đang ở trạng thái chờ xác nhận. Lễ tân phòng khám sẽ liên hệ qua điện thoại để hỗ trợ bạn.
                            </Typography>
                        </Box>
                    </Box>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2.25, sm: 3 },
                            bgcolor: "#F4F7FA",
                            borderRadius: "12px",
                            borderColor: "#C5D8EC",
                            mb: 3,
                        }}
                    >
                        <Stack spacing={2}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                <Typography sx={{ fontSize: 13, color: "#475569", fontWeight: 750, letterSpacing: "0.04em" }}>
                                    MÃ SỐ LỊCH HẸN
                                </Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0B4F8A", letterSpacing: "0.04em" }}>
                                    #{receipt.appointmentId}
                                </Typography>
                            </Box>
                            <Divider sx={{ borderColor: "#CEDCEB" }} />
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Bác sĩ tiếp nhận
                                    </Typography>
                                    <Typography sx={{ fontWeight: 750, color: "#0A2540" }}>{receipt.doctorName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Chuyên khoa
                                    </Typography>
                                    <Typography sx={{ fontWeight: 750, color: "#0A2540" }}>{receipt.departmentName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Ngày khám
                                    </Typography>
                                    <Typography sx={{ fontWeight: 750, color: "#0A2540" }}>
                                        {dateLabel(receipt.appointmentDate)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Khung giờ
                                    </Typography>
                                    <Typography sx={{ fontWeight: 750, color: "#0B4F8A" }}>
                                        {time(receipt.startTime)} – {time(receipt.endTime)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>

                    <Chip
                        label="Chờ lễ tân xác nhận"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 750, borderRadius: "8px", bgcolor: "#FFFBEB", color: "#92400E", borderColor: "#FCD34D", mb: 2.5 }}
                    />

                    <Alert severity="info" sx={{ mb: 3, borderRadius: "10px", bgcolor: "#EAF2FA", color: "#0A2540" }}>
                        <strong>Lưu ý quan trọng khi đến khám:</strong> Hãy đến quầy lễ tân trước <strong>10–15 phút</strong>, đọc mã lịch hẹn{" "}
                        <strong>#{receipt.appointmentId}</strong> và xuất trình sổ khám giấy (hoặc làm thủ tục mua/cấp lại sổ tại quầy).
                    </Alert>

                    <Typography sx={{ fontSize: 14.5, lineHeight: 1.8, color: "#1E293B", mb: 4 }}>
                        Vui lòng lưu lại mã số lịch hẹn trên. Khi cần điều chỉnh hoặc hủy lịch, vui lòng gọi đến tổng đài{" "}
                        <Link href={clinic.phoneHref} sx={{ fontWeight: 750 }}>
                            {clinic.phone}
                        </Link>{" "}
                        và cung cấp mã này. Lịch hẹn của khách không tự động gắn vào tài khoản tạo sau đó.
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="outlined"
                            size="large"
                            sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
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
                            sx={{
                                borderRadius: "10px",
                                fontWeight: 750,
                                textTransform: "none",
                                bgcolor: "#0B4F8A",
                                "&:hover": { bgcolor: "#083A66" },
                            }}
                        >
                            Đăng ký lịch hẹn khác
                        </Button>
                    </Stack>
                </Paper>
            </PublicPage>
        );
    }

    const step1Done = Boolean(department && doctor);
    const step2Done = Boolean(selectedSlot);
    const step3Done = Boolean(
        values.patientName.trim() && values.patientPhone.trim() && values.reason.trim() && values.consent
    );
    const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4;
    const checklist = [
        ["Chọn chuyên khoa & bác sĩ", step1Done],
        ["Chọn ngày & giờ khám còn trống", step2Done],
        ["Điền liên hệ, lý do & xác nhận", step3Done],
    ];

    return (
        <PublicPage
            badge="Đặt hẹn nhanh · Không bắt buộc tài khoản & sổ khám giấy"
            title="Đăng ký khám trực tuyến"
            description="Thực hiện lần lượt 3 bước đơn giản bên dưới để chọn chuyên khoa, bác sĩ và khung giờ trống 30 phút thuận tiện nhất."
        >
            {/* Login Suggestion Banner */}
            <Alert
                severity="info"
                icon={<ShieldOutlined />}
                sx={{
                    mb: 2.5,
                    borderRadius: "12px",
                    bgcolor: "#EAF2FA",
                    borderColor: "#90BCE6",
                    border: "1px solid",
                    color: "#0A2540",
                }}
            >
                Đã có tài khoản bệnh nhân?{" "}
                <Link
                    component={RouterLink}
                    to="/login"
                    state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}
                    sx={{ fontWeight: 750 }}
                >
                    Đăng nhập
                </Link>{" "}
                hoặc{" "}
                <Link
                    component={RouterLink}
                    to="/register"
                    state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}
                    sx={{ fontWeight: 750 }}
                >
                    đăng ký tài khoản
                </Link>{" "}
                để tự quản lý/hủy lịch hẹn, xem đơn thuốc và kết quả xét nghiệm trực tuyến.
            </Alert>

            {/* Visual 3-Step Indicator */}
            <Grid container spacing={1.5} sx={{ mb: 3.5 }}>
                {[
                    ["Bước 1", "Chọn chuyên khoa & bác sĩ", step1Done, currentStep === 1],
                    ["Bước 2", "Chọn ngày & khung giờ trống", step2Done, currentStep === 2],
                    ["Bước 3", "Điền thông tin liên hệ", step3Done, currentStep === 3],
                ].map(([stepLabel, title, done, active]) => (
                    <Grid key={stepLabel} size={{ xs: 12, sm: 4 }} sx={{ minWidth: 0 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.75,
                                height: "100%",
                                borderRadius: "12px",
                                borderColor: done ? "#6EE7B7" : active ? "#0B4F8A" : "#CEDCEB",
                                borderWidth: active ? 2 : 1,
                                bgcolor: done ? "#ECFDF5" : active ? "#FFFFFF" : "#F8FAFC",
                                boxShadow: active ? "0 0 0 3px rgba(11, 79, 138, 0.14)" : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.25,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    bgcolor: done ? "#059669" : active ? "#0B4F8A" : "#94A3B8",
                                    color: "#FFFFFF",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 13,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}
                            >
                                {done ? "✓" : stepLabel.slice(-1)}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 11.5,
                                            fontWeight: 800,
                                            color: done ? "#065F46" : active ? "#0B4F8A" : "#475569",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {stepLabel}
                                    </Typography>
                                    {active && (
                                        <Chip
                                            size="small"
                                            label="Đang làm"
                                            sx={{ height: 18, fontSize: 10.5, fontWeight: 800, bgcolor: "#0B4F8A", color: "#FFFFFF" }}
                                        />
                                    )}
                                </Stack>
                                <Typography sx={{ fontSize: 14, fontWeight: 750, color: "#0A2540", overflowWrap: "anywhere" }}>
                                    {title}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Box component="form" onSubmit={review} noValidate aria-busy={busy}>
                <Grid container spacing={3.5}>
                    {/* Left Form: 3 Steps */}
                    <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
                        <Stack spacing={3}>
                            {/* Step 1: Specialty & Doctor */}
                            <Paper
                                variant="outlined"
                                sx={{ ...sectionSx, ...activeCardSx(currentStep === 1, step1Done) }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.25}
                                    sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 2.5 }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "10px",
                                                bgcolor: step1Done ? "#059669" : "#0B4F8A",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <LocalHospitalOutlined sx={{ fontSize: 22 }} />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 17, sm: 18.5 }, color: "#0A2540" }}>
                                                1. Chọn chuyên khoa & bác sĩ
                                            </Typography>
                                            <Typography sx={{ fontSize: 13.5, color: "#475569" }}>
                                                Lựa chọn khoa điều trị trước, sau đó chọn bác sĩ tiếp nhận
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {step1Done ? (
                                        <Chip size="small" label="✓ Đã chọn" sx={{ alignSelf: "flex-start", bgcolor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7", fontWeight: 750 }} />
                                    ) : currentStep === 1 ? (
                                        <Chip size="small" label="Bước cần làm" sx={{ alignSelf: "flex-start", bgcolor: "#E6F0FA", color: "#0B4F8A", border: "1px solid #90BCE6", fontWeight: 750 }} />
                                    ) : null}
                                </Stack>

                                <Stack spacing={2.5}>
                                    <ResourceState resource={departments}>
                                        <TextField
                                            id="guest-departmentId"
                                            select
                                            label="Chuyên khoa khám"
                                            required
                                            {...field("departmentId")}
                                            value={department ? values.departmentId : ""}
                                            helperText={
                                                errors.departmentId ||
                                                "Lựa chọn chuyên khoa phù hợp với triệu chứng hoặc nhu cầu khám"
                                            }
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
                                            helperText={
                                                errors.doctorId ||
                                                (!department
                                                    ? "Vui lòng chọn chuyên khoa ở ô trên trước"
                                                    : "Chọn bác sĩ trong danh sách chuyên khoa")
                                            }
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
                                                sx={{ textTransform: "none", fontWeight: 750, color: "#0B4F8A" }}
                                            >
                                                Xem hồ sơ & kinh nghiệm của {doctor.title} {doctor.fullName} ↗
                                            </Button>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Step 2: Date & Slot */}
                            <Paper
                                variant="outlined"
                                sx={{ ...sectionSx, ...activeCardSx(currentStep === 2, step2Done) }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.25}
                                    sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 2.5 }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "10px",
                                                bgcolor: step2Done ? "#059669" : "#0B4F8A",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <AccessTimeOutlined sx={{ fontSize: 22 }} />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 17, sm: 18.5 }, color: "#0A2540" }}>
                                                2. Ngày & khung giờ khám
                                            </Typography>
                                            <Typography sx={{ fontSize: 13.5, color: "#475569" }}>
                                                Chọn ngày khám và bấm vào 1 khung giờ trống ({clinic.defaultSlotDurationMinutes} phút/lượt)
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {step2Done ? (
                                        <Chip size="small" label="✓ Đã chọn giờ" sx={{ alignSelf: "flex-start", bgcolor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7", fontWeight: 750 }} />
                                    ) : currentStep === 2 ? (
                                        <Chip size="small" label="Bước cần làm" sx={{ alignSelf: "flex-start", bgcolor: "#E6F0FA", color: "#0B4F8A", border: "1px solid #90BCE6", fontWeight: 750 }} />
                                    ) : null}
                                </Stack>

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

                                    {!doctor ? (
                                        <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#F0F7FF", color: "#0A2540" }}>
                                            Vui lòng hoàn tất chọn <strong>Bác sĩ tiếp nhận</strong> ở Bước 1 để xem các khung giờ còn trống.
                                        </Alert>
                                    ) : (
                                        <Box>
                                            <Stack
                                                direction="row"
                                                sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontWeight: 750, fontSize: 14.5, color: "#0A2540" }}>
                                                    Khung giờ khám còn trống ({available.length} chỗ):
                                                </Typography>
                                                <Button
                                                    onClick={() => {
                                                        update("startTime", "");
                                                        slots.retry();
                                                    }}
                                                    disabled={busy || slots.status === "loading"}
                                                    startIcon={<RefreshOutlined />}
                                                    size="small"
                                                    sx={{ textTransform: "none", fontWeight: 700, color: "#0B4F8A" }}
                                                >
                                                    Làm mới giờ trống
                                                </Button>
                                            </Stack>

                                            <ResourceState resource={slots}>
                                                {slots.data?.length ? (
                                                    <Box
                                                        role="group"
                                                        aria-label="Giờ khám còn trống"
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: "repeat(auto-fill, minmax(98px, 1fr))",
                                                            gap: 1.25,
                                                        }}
                                                    >
                                                        {slots.data.map(slot => {
                                                            const isSelected = values.startTime === slot.startTime;
                                                            return (
                                                                <Button
                                                                    id={
                                                                        slot.startTime === available[0]?.startTime
                                                                            ? "guest-startTime"
                                                                            : undefined
                                                                    }
                                                                    key={slot.startTime}
                                                                    disabled={!slot.isAvailable || busy}
                                                                    variant={isSelected ? "contained" : "outlined"}
                                                                    aria-pressed={isSelected}
                                                                    onClick={() => update("startTime", slot.startTime)}
                                                                    sx={{
                                                                        minHeight: 50,
                                                                        minWidth: 0,
                                                                        borderRadius: "8px",
                                                                        fontWeight: 800,
                                                                        fontSize: 14.5,
                                                                        fontVariantNumeric: "tabular-nums",
                                                                        textTransform: "none",
                                                                        border: slot.isAvailable
                                                                            ? isSelected
                                                                                ? "2px solid #0B4F8A"
                                                                                : "1.5px solid #059669"
                                                                            : "1px solid #CBD5E1",
                                                                        bgcolor: isSelected
                                                                            ? "#0B4F8A"
                                                                            : slot.isAvailable
                                                                            ? "#ECFDF5"
                                                                            : "#F1F5F9",
                                                                        color: isSelected
                                                                            ? "#FFFFFF"
                                                                            : slot.isAvailable
                                                                            ? "#065F46"
                                                                            : "#64748B",
                                                                        "&:hover": {
                                                                            bgcolor: isSelected ? "#083A66" : "#D1FAE5",
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
                                        </Box>
                                    )}

                                    {errors.startTime && (
                                        <Typography role="alert" color="error" sx={{ fontSize: 13.5, fontWeight: 650 }}>
                                            {errors.startTime}
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Step 3: Patient Information */}
                            <Paper
                                variant="outlined"
                                sx={{ ...sectionSx, ...activeCardSx(currentStep === 3, step3Done) }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.25}
                                    sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 2.5 }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "10px",
                                                bgcolor: step3Done ? "#059669" : "#0B4F8A",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <PersonOutlineOutlined sx={{ fontSize: 22 }} />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 17, sm: 18.5 }, color: "#0A2540" }}>
                                                3. Thông tin người khám
                                            </Typography>
                                            <Typography sx={{ fontSize: 13.5, color: "#475569" }}>
                                                Thông tin liên hệ để lễ tân gọi xác nhận lịch hẹn và đón tiếp tại quầy
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {step3Done ? (
                                        <Chip size="small" label="✓ Đã điền" sx={{ alignSelf: "flex-start", bgcolor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7", fontWeight: 750 }} />
                                    ) : currentStep === 3 ? (
                                        <Chip size="small" label="Bước cần làm" sx={{ alignSelf: "flex-start", bgcolor: "#E6F0FA", color: "#0B4F8A", border: "1px solid #90BCE6", fontWeight: 750 }} />
                                    ) : null}
                                </Stack>

                                <Stack spacing={2.5}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                id="guest-patientName"
                                                label="Họ và tên người khám"
                                                placeholder="Ví dụ: Nguyễn Văn A"
                                                autoComplete="name"
                                                required
                                                {...field("patientName")}
                                                slotProps={{ htmlInput: { maxLength: 100 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                id="guest-patientPhone"
                                                label="Số điện thoại liên hệ"
                                                placeholder="Ví dụ: 0912345678"
                                                type="tel"
                                                autoComplete="tel"
                                                required
                                                {...field("patientPhone")}
                                                slotProps={{ htmlInput: { maxLength: 15 } }}
                                                helperText={
                                                    errors.patientPhone ||
                                                    "Phòng khám sẽ gọi vào số này để xác nhận lịch hẹn"
                                                }
                                            />
                                        </Grid>
                                    </Grid>

                                    <TextField
                                        id="guest-reason"
                                        label="Triệu chứng hoặc lý do khám"
                                        placeholder="Mô tả ngắn gọn lý do khám hoặc biểu hiện sức khỏe cần bác sĩ tư vấn..."
                                        multiline
                                        minRows={3}
                                        required
                                        {...field("reason")}
                                        slotProps={{ htmlInput: { maxLength: 500 } }}
                                    />

                                    <Box
                                        sx={{
                                            p: 1.75,
                                            borderRadius: "10px",
                                            bgcolor: values.consent ? "#ECFDF5" : "#F8FAFC",
                                            border: `1px solid ${errors.consent ? "#FCA5A5" : values.consent ? "#6EE7B7" : "#DCE7F2"}`,
                                        }}
                                    >
                                        <FormControlLabel
                                            sx={{ alignItems: "flex-start", m: 0 }}
                                            control={
                                                <Checkbox
                                                    id="guest-consent"
                                                    checked={values.consent}
                                                    onChange={e => update("consent", e.target.checked)}
                                                    disabled={busy}
                                                    color="primary"
                                                    sx={{ pt: 0.25 }}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ fontSize: 14, lineHeight: 1.6, color: "#1E293B" }}>
                                                    Tôi xác nhận thông tin cung cấp là chính xác và đồng ý để phòng khám liên hệ qua điện thoại xác nhận lịch khám.{" "}
                                                    <Link component={RouterLink} to="/privacy" underline="hover" sx={{ fontWeight: 700 }}>
                                                        Chính sách bảo mật
                                                    </Link>
                                                </Typography>
                                            }
                                        />
                                        {errors.consent && (
                                            <Typography color="error" role="alert" sx={{ fontSize: 13.5, mt: 0.5, pl: 4 }}>
                                                {errors.consent}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Summary Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                ...sectionSx,
                                position: { md: "sticky" },
                                top: 108,
                                borderColor: "#90BCE6",
                                borderTop: "4px solid #0B4F8A",
                            }}
                        >
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                                <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: 18, color: "#0A2540" }}>
                                    Tóm tắt đăng ký khám
                                </Typography>
                                <Chip
                                    size="small"
                                    label={step1Done && step2Done && step3Done ? "Sẵn sàng" : `Bước ${currentStep}/3`}
                                    sx={{
                                        bgcolor: step1Done && step2Done && step3Done ? "#ECFDF5" : "#E6F0FA",
                                        color: step1Done && step2Done && step3Done ? "#065F46" : "#0B4F8A",
                                        fontWeight: 750,
                                    }}
                                />
                            </Stack>

                            <Stack spacing={2}>
                                <Box sx={{ p: 2, bgcolor: "#F4F7FA", borderRadius: "12px", border: "1px solid #C5D8EC" }}>
                                    <Stack spacing={1.35}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Chuyên khoa
                                            </Typography>
                                            <Typography sx={{ fontWeight: 750, color: "#0A2540", fontSize: 14.5 }}>
                                                {department?.name || (
                                                    <Box component="span" sx={{ color: "#64748B", fontWeight: 500 }}>
                                                        Chưa chọn
                                                    </Box>
                                                )}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#DCE7F2" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Bác sĩ
                                            </Typography>
                                            <Typography sx={{ fontWeight: 750, color: "#0A2540", fontSize: 14.5 }}>
                                                {doctor ? `${doctor.title} ${doctor.fullName}` : (
                                                    <Box component="span" sx={{ color: "#64748B", fontWeight: 500 }}>
                                                        Chưa chọn
                                                    </Box>
                                                )}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#DCE7F2" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Ngày & giờ khám dự kiến
                                            </Typography>
                                            <Typography sx={{ fontWeight: 800, color: "#0B4F8A", fontSize: 15 }}>
                                                {dateLabel(values.date)}
                                                {selectedSlot ? ` · ${time(selectedSlot.startTime)}` : " · Chưa chọn giờ"}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: "#DCE7F2" }} />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Phí khám niêm yết
                                            </Typography>
                                            <Typography sx={{ fontWeight: 800, color: "#0A2540", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                                                {money(clinic.defaultExaminationFee)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Completion Checklist */}
                                <Box
                                    sx={{
                                        p: 1.75,
                                        borderRadius: "12px",
                                        bgcolor: step1Done && step2Done && step3Done ? "#ECFDF5" : "#F8FAFC",
                                        border: `1px solid ${step1Done && step2Done && step3Done ? "#6EE7B7" : "#DCE7F2"}`,
                                    }}
                                >
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#334155", mb: 0.75, textTransform: "uppercase" }}>
                                        Các mục cần hoàn tất
                                    </Typography>
                                    <Stack spacing={0.65}>
                                        {checklist.map(([label, done]) => (
                                            <Stack key={label} direction="row" spacing={0.85} sx={{ alignItems: "center" }}>
                                                {done ? (
                                                    <CheckCircleOutlined sx={{ fontSize: 16, color: "#059669", flexShrink: 0 }} />
                                                ) : (
                                                    <RadioButtonUncheckedOutlined sx={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }} />
                                                )}
                                                <Typography sx={{ fontSize: 13, fontWeight: done ? 700 : 500, color: done ? "#065F46" : "#475569" }}>
                                                    {label}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>

                                <Alert severity="info" sx={{ borderRadius: "10px", fontSize: 13, lineHeight: 1.55, bgcolor: "#EAF2FA", color: "#0A2540" }}>
                                    Đặt lịch trực tuyến hoàn toàn <strong>miễn phí</strong>. Lễ tân sẽ liên hệ xác nhận giờ khám qua điện thoại.
                                </Alert>

                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: "10px", fontSize: 13.5 }}>
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
                                        py: 1.45,
                                        fontWeight: 750,
                                        fontSize: 15.5,
                                        textTransform: "none",
                                        bgcolor: "#0B4F8A",
                                        "&:hover": { bgcolor: "#083A66" },
                                    }}
                                >
                                    Kiểm tra đăng ký khám
                                </Button>

                                <Box sx={{ textAlign: "center", pt: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: "#334155", fontSize: 13 }}>
                                        Cần hỗ trợ? Gọi tổng đài:{" "}
                                        <Link href={clinic.phoneHref} sx={{ fontWeight: 800, color: "#0B4F8A" }}>
                                            {clinic.phone}
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
                        },
                    },
                }}
            >
                <DialogTitle id="guest-confirm-title" sx={{ fontWeight: 800, fontSize: 19.5, color: "#0A2540", pt: 3 }}>
                    Xác nhận thông tin đăng ký khám
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "12px", bgcolor: "#F4F7FA", borderColor: "#C5D8EC" }}>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Người khám:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540", textAlign: "right" }}>
                                        {values.patientName}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Số điện thoại:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540", textAlign: "right" }}>
                                        {values.patientPhone}
                                    </Typography>
                                </Box>
                                <Divider sx={{ borderColor: "#DCE7F2" }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chuyên khoa:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540", textAlign: "right" }}>
                                        {department?.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Bác sĩ:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540", textAlign: "right" }}>
                                        {doctor?.title} {doctor?.fullName}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Thời gian hẹn:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#0B4F8A", textAlign: "right" }}>
                                        {selectedSlot && `${time(selectedSlot.startTime)} – ${time(selectedSlot.endTime)}`},{" "}
                                        {dateLabel(values.date)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ borderColor: "#DCE7F2" }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.35 }}>
                                        Lý do khám / triệu chứng:
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#0A2540" }}>
                                        {values.reason}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Typography variant="body2" sx={{ fontSize: 13.5, lineHeight: 1.6, color: "#334155" }}>
                            Sau khi gửi, nhân viên tiếp nhận của phòng khám sẽ liên hệ qua số điện thoại để xác nhận lịch hẹn của bạn.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, flexWrap: "wrap" }}>
                    <Button
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                        variant="outlined"
                        sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                    >
                        Chỉnh sửa lại
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submit}
                        disabled={!ready}
                        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CalendarMonthOutlined />}
                        sx={{
                            borderRadius: "10px",
                            px: 3,
                            fontWeight: 750,
                            textTransform: "none",
                            bgcolor: "#0B4F8A",
                            "&:hover": { bgcolor: "#083A66" },
                        }}
                    >
                        {busy ? "Đang gửi đăng ký..." : "Gửi đăng ký khám"}
                    </Button>
                </DialogActions>
            </Dialog>
        </PublicPage>
    );
}
