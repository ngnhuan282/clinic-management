import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    ArrowForward,
    AssignmentTurnedInOutlined,
    AutoFixHighOutlined,
    CalendarMonthOutlined,
    CheckCircleOutlined,
    EventAvailableOutlined,
    LocalHospitalOutlined,
    LocationOnOutlined,
    PersonOutlineOutlined,
    PhoneInTalkOutlined,
    RadioButtonUncheckedOutlined,
    RefreshOutlined,
    RestartAltOutlined,
    SensorsOutlined,
    WarningAmberRounded,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useBooking from "../../hooks/useBooking";
import { useClinicInfo } from "../../api/publicApi";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { clinicPageCanvasSx, clinicSurfaceSx } from "../../components/common/clinicUi";
import { clinicToday } from "../../utils/publicBooking";

const STEPS = [
    ["Bước 1", "Chuyên khoa & bác sĩ", "Chọn nơi khám"],
    ["Bước 2", "Ngày & giờ khám", "Khung 30 phút"],
    ["Bước 3", "Thông tin người khám", "Liên hệ & triệu chứng"],
    ["Bước 4", "Xác nhận đặt hẹn", "Kiểm tra & gửi"],
];

function formatTime(value) {
    return String(value || "").slice(0, 5);
}

function formatDateLabel(value) {
    if (!value) return "Chưa chọn";
    const [year, month, day] = String(value).slice(0, 10).split("-");
    return day ? `${day}/${month}/${year}` : value;
}

function toDateInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function money(value) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function getDateCards(selectedDate, slots) {
    const today = new Date();
    const selectedAvailableCount = slots.filter(slot => slot.isAvailable).length;

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const value = toDateInput(date);

        return {
            value,
            dayName: date.getDay() === 0 ? "Chủ nhật" : `Thứ ${date.getDay() + 1}`,
            day: String(date.getDate()).padStart(2, "0"),
            month: String(date.getMonth() + 1).padStart(2, "0"),
            label: index === 0 ? "Hôm nay" : "",
            availableCount: value === selectedDate ? selectedAvailableCount : null,
        };
    });
}

function stepCardBorderSx(active, done) {
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

function BookingPage() {
    const { isAuthenticated, user } = useAuth();
    const clinic = useClinicInfo();
    const booking = useBooking();
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

    const dateCards = useMemo(
        () => getDateCards(booking.selectedDate, booking.slots),
        [booking.selectedDate, booking.slots]
    );

    const morningSlots = booking.slots.filter(slot => formatTime(slot.startTime) < "12:00");
    const afternoonSlots = booking.slots.filter(slot => formatTime(slot.startTime) >= "12:00");
    const availableCount = booking.slots.filter(slot => slot.isAvailable).length;

    const step1Done = Boolean(booking.selectedDepartmentId && booking.selectedDoctorId);
    const step2Done = Boolean(booking.selectedDate && booking.selectedSlot);
    const step3Done = Boolean(
        booking.patientName.trim() && booking.patientPhone.trim() && booking.reason.trim()
    );
    const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4;
    const doneSteps = new Set([
        step1Done ? 1 : null,
        step2Done ? 2 : null,
        step3Done ? 3 : null,
    ].filter(Boolean));

    const successAppointmentId = booking.successAppointment?.appointmentId;
    useEffect(() => {
        if (successAppointmentId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSuccessDialogOpen(true);
        }
    }, [successAppointmentId]);

    const fillFromAccount = () => {
        if (user?.fullName) booking.setPatientName(user.fullName);
        if (user?.phone) booking.setPatientPhone(user.phone);
    };

    const primaryLocation = clinic.locations?.[0];

    return (
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        eyebrow="Đặt lịch khám trực tuyến · Không bắt buộc có sổ khám giấy"
                        title="Đặt lịch khám trực tuyến"
                        icon={CalendarMonthOutlined}
                        description="Hoàn tất lần lượt 4 bước bên dưới để đặt khung giờ khám 30 phút. Hệ thống tự động kiểm tra ca bác sĩ đã duyệt và cập nhật chỗ trống theo thời gian thực."
                        actions={
                            <Button
                                component={Link}
                                to="/my-appointments"
                                variant="outlined"
                                startIcon={<EventAvailableOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    bgcolor: "#FFFFFF",
                                    borderColor: "#90BCE6",
                                    color: "#0B4F8A",
                                    fontWeight: 750,
                                    "&:hover": { bgcolor: "#E6F0FA", borderColor: "#0B4F8A" },
                                }}
                            >
                                Xem lịch hẹn của tôi
                            </Button>
                        }
                    />

                    {/* Highlighted 4-Step Guided Stepper */}
                    <Grid container spacing={1.5}>
                        {STEPS.map(([stepLabel, title, hint], idx) => {
                            const num = idx + 1;
                            const done = doneSteps.has(num);
                            const active = currentStep === num;
                            return (
                                <Grid key={stepLabel} size={{ xs: 12, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
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
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                bgcolor: done ? "#059669" : active ? "#0B4F8A" : "#94A3B8",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {done ? "✓" : num}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        color: done ? "#065F46" : active ? "#0B4F8A" : "#475569",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.03em",
                                                    }}
                                                >
                                                    {stepLabel}
                                                </Typography>
                                                {active && (
                                                    <Chip
                                                        size="small"
                                                        label="Đang làm"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: 10.5,
                                                            fontWeight: 800,
                                                            bgcolor: "#0B4F8A",
                                                            color: "#FFFFFF",
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "#0A2540", lineHeight: 1.3, mt: 0.2 }}>
                                                {title}
                                            </Typography>
                                            <Typography sx={{ fontSize: 12, color: done ? "#047857" : "#64748B", mt: 0.1 }}>
                                                {done ? "Đã hoàn tất" : hint}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {booking.error && (
                        <Alert severity="error" sx={{ borderRadius: "12px" }}>
                            {booking.error}
                        </Alert>
                    )}

                    {booking.successAppointment && (
                        <Alert severity="success" icon={<CheckCircleOutlined />} sx={{ borderRadius: "12px" }}>
                            Đã ghi nhận lịch khám mã <strong>#{booking.successAppointment.appointmentId}</strong> lúc{" "}
                            <strong>{formatTime(booking.successAppointment.startTime)}</strong> ngày{" "}
                            <strong>{formatDateLabel(booking.successAppointment.appointmentDate)}</strong>. Lịch đang ở trạng thái{" "}
                            <strong>Chờ xác nhận</strong> — bạn có thể theo dõi tại mục{" "}
                            <Link to="/my-appointments" style={{ fontWeight: 700, color: "inherit" }}>
                                Lịch hẹn của tôi
                            </Link>
                            .
                        </Alert>
                    )}

                    <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
                        {/* Left Column: Booking Steps */}
                        <Grid size={{ xs: 12, lg: 8 }} sx={{ minWidth: 0 }}>
                            <Stack spacing={3}>
                                {/* Card 1: Specialty & Doctor */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        ...clinicSurfaceSx,
                                        p: { xs: 2.25, sm: 3.25 },
                                        borderRadius: "16px",
                                        ...stepCardBorderSx(currentStep === 1, step1Done),
                                    }}
                                >
                                    <Stack spacing={2.5}>
                                        <SectionHeading
                                            icon={<LocalHospitalOutlined sx={{ fontSize: 22 }} />}
                                            title="1. Chọn chuyên khoa & bác sĩ"
                                            subtitle="Bước đầu tiên: chọn khoa khám, sau đó bấm chọn một thẻ bác sĩ bên dưới"
                                            active={currentStep === 1}
                                            done={step1Done}
                                        />

                                        <TextField
                                            select
                                            fullWidth
                                            label="Chuyên khoa"
                                            value={booking.selectedDepartmentId}
                                            onChange={event => booking.setSelectedDepartmentId(event.target.value)}
                                            disabled={booking.loading.departments}
                                            helperText="Chỉ hiển thị các chuyên khoa đang mở đặt lịch trực tuyến"
                                        >
                                            <MenuItem value="">-- Chọn chuyên khoa --</MenuItem>
                                            {booking.departments.map(department => (
                                                <MenuItem key={department.departmentId} value={department.departmentId}>
                                                    {department.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {booking.selectedDepartmentId ? (
                                            <Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.25, flexWrap: "wrap" }}
                                                >
                                                    <Typography sx={{ fontSize: 14, fontWeight: 750, color: "#0A2540" }}>
                                                        Bấm chọn bác sĩ tiếp nhận trong chuyên khoa:
                                                    </Typography>
                                                    {!booking.selectedDoctorId && !booking.loading.doctors && booking.doctors.length > 0 && (
                                                        <Chip
                                                            size="small"
                                                            label="Cần chọn 1 bác sĩ"
                                                            sx={{ bgcolor: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D", fontWeight: 700 }}
                                                        />
                                                    )}
                                                </Stack>
                                                {booking.loading.doctors ? (
                                                    <InlineLoading text="Đang tải danh sách bác sĩ..." />
                                                ) : booking.doctors.length === 0 ? (
                                                    <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                                        Chuyên khoa này hiện chưa có bác sĩ nhận đặt lịch trực tuyến.
                                                    </Alert>
                                                ) : (
                                                    <Grid container spacing={1.5}>
                                                        {booking.doctors.map(doctor => {
                                                            const selected =
                                                                booking.selectedDoctorId === String(doctor.doctorId);
                                                            return (
                                                                <Grid size={{ xs: 12, sm: 6 }} key={doctor.doctorId} sx={{ minWidth: 0 }}>
                                                                    <DoctorSelectCard
                                                                        doctor={doctor}
                                                                        selected={selected}
                                                                        onClick={() =>
                                                                            booking.setSelectedDoctorId(
                                                                                String(doctor.doctorId)
                                                                            )
                                                                        }
                                                                    />
                                                                </Grid>
                                                            );
                                                        })}
                                                    </Grid>
                                                )}
                                            </Box>
                                        ) : (
                                            <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#F0F7FF", color: "#0A2540" }}>
                                                Hãy chọn <strong>Chuyên khoa</strong> ở ô trên để hiển thị danh sách bác sĩ phụ trách.
                                            </Alert>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* Card 2: Date & Time Slot */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        ...clinicSurfaceSx,
                                        p: { xs: 2.25, sm: 3.25 },
                                        borderRadius: "16px",
                                        ...stepCardBorderSx(currentStep === 2, step2Done),
                                    }}
                                >
                                    <Stack spacing={2.5}>
                                        <SectionHeading
                                            icon={<CalendarMonthOutlined sx={{ fontSize: 22 }} />}
                                            title="2. Chọn ngày & khung giờ khám"
                                            subtitle={`Mỗi khung giờ ${clinic.defaultSlotDurationMinutes} phút (UTC+7) · Chỉ mở các ca trực đã được phê duyệt`}
                                            active={currentStep === 2}
                                            done={step2Done}
                                        />

                                        {/* Quick 6-day selector */}
                                        <Box>
                                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#334155", mb: 1.25 }}>
                                                Chọn nhanh ngày khám trong 6 ngày tới:
                                            </Typography>
                                            <Grid container spacing={1.25}>
                                                {dateCards.map(card => {
                                                    const selected = booking.selectedDate === card.value;
                                                    return (
                                                        <Grid size={{ xs: 4, sm: 4, md: 2 }} key={card.value} sx={{ minWidth: 0 }}>
                                                            <Button
                                                                fullWidth
                                                                onClick={() => booking.setSelectedDate(card.value)}
                                                                sx={{
                                                                    height: 82,
                                                                    p: 0.75,
                                                                    minWidth: 0,
                                                                    borderRadius: "10px",
                                                                    border: selected
                                                                        ? "2px solid #0B4F8A"
                                                                        : "1px solid #B8CCE0",
                                                                    bgcolor: selected ? "#0B4F8A" : "#FFFFFF",
                                                                    color: selected ? "#FFFFFF" : "#0A2540",
                                                                    position: "relative",
                                                                    "&:hover": {
                                                                        borderColor: "#0B4F8A",
                                                                        bgcolor: selected ? "#083A66" : "#E6F0FA",
                                                                    },
                                                                }}
                                                            >
                                                                {card.label && (
                                                                    <Chip
                                                                        label={card.label}
                                                                        size="small"
                                                                        sx={{
                                                                            position: "absolute",
                                                                            top: -10,
                                                                            height: 20,
                                                                            bgcolor: selected ? "#FFFFFF" : "#0B4F8A",
                                                                            color: selected ? "#0A2540" : "#FFFFFF",
                                                                            fontSize: 10,
                                                                            fontWeight: 800,
                                                                        }}
                                                                    />
                                                                )}
                                                                <Stack spacing={0.2} sx={{ alignItems: "center" }}>
                                                                    <Typography
                                                                        sx={{
                                                                            color: selected ? "#E6F0FA" : "#475569",
                                                                            fontSize: 11.5,
                                                                            fontWeight: 650,
                                                                        }}
                                                                    >
                                                                        {card.dayName}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontWeight: 800,
                                                                            fontSize: { xs: 15, sm: 17 },
                                                                            fontVariantNumeric: "tabular-nums",
                                                                            color: selected ? "#FFFFFF" : "#0A2540",
                                                                        }}
                                                                    >
                                                                        {card.day}/{card.month}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: 11,
                                                                            fontWeight: 700,
                                                                            color: selected
                                                                                ? "#BAE6FD"
                                                                                : card.availableCount === null
                                                                                ? "#0B4F8A"
                                                                                : card.availableCount > 0
                                                                                ? "#065F46"
                                                                                : "#92400E",
                                                                        }}
                                                                    >
                                                                        {card.availableCount === null
                                                                            ? "Xem lịch"
                                                                            : `${card.availableCount} chỗ`}
                                                                    </Typography>
                                                                </Stack>
                                                            </Button>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        </Box>

                                        {/* Full calendar date picker + Legend + Refresh */}
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1.5}
                                            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", flexWrap: "wrap" }}
                                        >
                                            <TextField
                                                type="date"
                                                label="Hoặc chọn ngày khám khác trên lịch"
                                                value={booking.selectedDate}
                                                onChange={e => booking.setSelectedDate(e.target.value)}
                                                size="small"
                                                sx={{ maxWidth: { sm: 280 }, width: "100%" }}
                                                slotProps={{
                                                    inputLabel: { shrink: true },
                                                    htmlInput: { min: clinicToday() },
                                                }}
                                            />
                                            <SlotLegend />
                                        </Stack>

                                        <Divider sx={{ borderColor: "#E2ECF5" }} />

                                        {/* Time Slots */}
                                        {!booking.selectedDoctorId || !booking.selectedDate ? (
                                            <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#EAF2FA", color: "#0A2540" }}>
                                                Vui lòng hoàn tất chọn <strong>Bác sĩ</strong> (Bước 1) và <strong>Ngày khám</strong> để hiển thị bảng giờ trống.
                                            </Alert>
                                        ) : booking.loading.slots ? (
                                            <InlineLoading text="Đang kiểm tra khung giờ trống..." />
                                        ) : booking.slots.length === 0 ? (
                                            <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                                Bác sĩ chưa có ca trực được duyệt hoặc không còn khung giờ trống trong ngày{" "}
                                                <strong>{formatDateLabel(booking.selectedDate)}</strong>. Vui lòng chọn ngày khác.
                                            </Alert>
                                        ) : (
                                            <Stack spacing={2.25}>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    spacing={1}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: "10px",
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #DCE7F2",
                                                        alignItems: { sm: "center" },
                                                        justifyContent: "space-between",
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                                        <SensorsOutlined sx={{ fontSize: 18, color: "#059669" }} />
                                                        <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 650 }}>
                                                            Còn <strong>{availableCount}</strong>/{booking.slots.length} khung giờ trống · Tự động khóa nếu vừa có người đặt trùng
                                                        </Typography>
                                                    </Stack>
                                                    <Button
                                                        type="button"
                                                        size="small"
                                                        startIcon={<RefreshOutlined sx={{ fontSize: 16 }} />}
                                                        disabled={booking.loading.slots || booking.loading.submitting}
                                                        onClick={() => booking.refreshSlots(true)}
                                                        sx={{
                                                            alignSelf: { xs: "flex-start", sm: "center" },
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            color: "#0B4F8A",
                                                        }}
                                                    >
                                                        Làm mới giờ trống
                                                    </Button>
                                                </Stack>

                                                {morningSlots.length > 0 && (
                                                    <SlotGroup
                                                        title="Ca sáng (Trước 12:00)"
                                                        slots={morningSlots}
                                                        booking={booking}
                                                    />
                                                )}
                                                {afternoonSlots.length > 0 && (
                                                    <SlotGroup
                                                        title="Ca chiều (Từ 12:00)"
                                                        slots={afternoonSlots}
                                                        booking={booking}
                                                    />
                                                )}
                                            </Stack>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* Card 3: Patient Info & Reason */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        ...clinicSurfaceSx,
                                        p: { xs: 2.25, sm: 3.25 },
                                        borderRadius: "16px",
                                        ...stepCardBorderSx(currentStep === 3, step3Done),
                                    }}
                                >
                                    <Stack spacing={2.5}>
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1.5}
                                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                                        >
                                            <SectionHeading
                                                icon={<PersonOutlineOutlined sx={{ fontSize: 22 }} />}
                                                title="3. Thông tin người khám & triệu chứng"
                                                subtitle="Điền đủ 3 trường bắt buộc (*) để lễ tân xác nhận và bác sĩ chuẩn bị trước"
                                                active={currentStep === 3}
                                                done={step3Done}
                                            />
                                            {(user?.fullName || user?.phone) && (
                                                <Button
                                                    type="button"
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AutoFixHighOutlined sx={{ fontSize: 16 }} />}
                                                    onClick={fillFromAccount}
                                                    sx={{
                                                        alignSelf: { xs: "flex-start", sm: "center" },
                                                        borderRadius: "8px",
                                                        fontSize: 13,
                                                        fontWeight: 750,
                                                        borderColor: "#90BCE6",
                                                        bgcolor: "#E6F0FA",
                                                        color: "#0B4F8A",
                                                        "&:hover": { bgcolor: "#D2E5F8", borderColor: "#0B4F8A" },
                                                    }}
                                                >
                                                    Điền từ tài khoản của tôi
                                                </Button>
                                            )}
                                        </Stack>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    label="Họ và tên bệnh nhân"
                                                    placeholder="Ví dụ: Nguyễn Văn An"
                                                    value={booking.patientName}
                                                    onChange={event => booking.setPatientName(event.target.value)}
                                                    required
                                                    fullWidth
                                                    slotProps={{ htmlInput: { maxLength: 100 } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    label="Số điện thoại liên hệ"
                                                    placeholder="Ví dụ: 0912345678"
                                                    type="tel"
                                                    value={booking.patientPhone}
                                                    onChange={event => booking.setPatientPhone(event.target.value)}
                                                    required
                                                    fullWidth
                                                    slotProps={{ htmlInput: { maxLength: 15 } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="Mô tả lý do khám & triệu chứng ban đầu"
                                                    placeholder="Ví dụ: Đau đầu âm ỉ 3 ngày nay, cần khám nội tổng quát và kiểm tra huyết áp..."
                                                    value={booking.reason}
                                                    onChange={event => booking.setReason(event.target.value)}
                                                    required
                                                    fullWidth
                                                    multiline
                                                    minRows={3}
                                                    helperText={`${booking.reason.length}/500 ký tự · Mô tả rõ triệu chứng giúp bác sĩ nắm bắt tình trạng nhanh hơn`}
                                                    slotProps={{ htmlInput: { maxLength: 500 } }}
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* Reassuring Emergency Notice */}
                                        <Box
                                            sx={{
                                                p: 2,
                                                border: "1px solid #FCD34D",
                                                bgcolor: "#FFFBEB",
                                                borderRadius: "10px",
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                                                <WarningAmberRounded sx={{ color: "#B45309", mt: 0.15, flexShrink: 0 }} />
                                                <Typography sx={{ color: "#78350F", fontSize: 13.5, lineHeight: 1.6 }}>
                                                    <strong>Lưu ý cấp cứu:</strong> Nếu có triệu chứng khẩn cấp như đau tức ngực dữ dội, khó thở cấp tính hoặc sốt cao co giật, vui lòng gọi ngay{" "}
                                                    <strong>{clinic.phone}</strong> hoặc đến cơ sở cấp cứu gần nhất thay vì chờ lịch hẹn trực tuyến.
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* Right Column: Sticky Summary Panel */}
                        <Grid size={{ xs: 12, lg: 4 }} sx={{ minWidth: 0 }}>
                            <Stack spacing={2.5} sx={{ position: { lg: "sticky" }, top: 108 }}>
                                <SummaryPanel
                                    booking={booking}
                                    clinic={clinic}
                                    primaryLocation={primaryLocation}
                                    currentStep={currentStep}
                                    step1Done={step1Done}
                                    step2Done={step2Done}
                                    step3Done={step3Done}
                                    onSubmit={booking.submitBooking}
                                    onReset={booking.resetForm}
                                    isAuthenticated={isAuthenticated}
                                />

                                <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5, borderRadius: "14px" }}>
                                    <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "10px",
                                                bgcolor: "#0B4F8A",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <PhoneInTalkOutlined />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ color: "#0A2540", fontWeight: 750, fontSize: 15 }}>
                                                Tổng đài hỗ trợ đặt hẹn
                                            </Typography>
                                            <Typography sx={{ color: "#334155", fontSize: 13.5, mt: 0.25 }}>
                                                Hotline:{" "}
                                                <Box component="a" href={clinic.phoneHref} sx={{ color: "#0B4F8A", fontWeight: 800, textDecoration: "none" }}>
                                                    {clinic.phone}
                                                </Box>
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Container>

            <BookingSuccessDialog
                open={successDialogOpen}
                appointment={booking.successAppointment}
                onClose={() => setSuccessDialogOpen(false)}
            />
        </Box>
    );
}

function SectionHeading({ icon, title, subtitle, active, done }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: done ? "#059669" : "#0B4F8A",
                        color: "#FFFFFF",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography component="h2" sx={{ color: "#0A2540", fontSize: { xs: 16.5, sm: 18 }, fontWeight: 800, lineHeight: 1.3 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography sx={{ color: "#475569", fontSize: 13.5, mt: 0.25 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>
            {done ? (
                <Chip
                    size="small"
                    label="✓ Đã chọn"
                    sx={{ alignSelf: "flex-start", bgcolor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7", fontWeight: 750 }}
                />
            ) : active ? (
                <Chip
                    size="small"
                    label="Bước cần làm"
                    sx={{ alignSelf: "flex-start", bgcolor: "#E6F0FA", color: "#0B4F8A", border: "1px solid #90BCE6", fontWeight: 750 }}
                />
            ) : null}
        </Stack>
    );
}

function DoctorSelectCard({ doctor, selected, onClick }) {
    const initials = doctor.fullName
        ? doctor.fullName
              .trim()
              .split(" ")
              .slice(-2)
              .map(part => part[0])
              .join("")
              .toUpperCase()
        : "BS";

    return (
        <Button
            fullWidth
            onClick={onClick}
            aria-pressed={selected}
            sx={{
                p: 1.75,
                justifyContent: "flex-start",
                textAlign: "left",
                borderRadius: "12px",
                border: selected ? "2px solid #0B4F8A" : "1px solid #C5D8EC",
                bgcolor: selected ? "#E6F0FA" : "#FFFFFF",
                boxShadow: selected ? "0 4px 12px rgba(11, 79, 138, 0.12)" : "none",
                color: "#1E293B",
                "&:hover": {
                    borderColor: "#0B4F8A",
                    bgcolor: "#E6F0FA",
                },
            }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: selected ? "#0B4F8A" : "#E6F0FA",
                        color: selected ? "#FFFFFF" : "#0B4F8A",
                        fontWeight: 800,
                        fontSize: 15,
                        flexShrink: 0,
                    }}
                >
                    {initials}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Chip
                            label={doctor.title || "BS"}
                            size="small"
                            sx={{
                                bgcolor: "#0B4F8A",
                                color: "#FFFFFF",
                                fontWeight: 750,
                                height: 22,
                                fontSize: 11.5,
                            }}
                        />
                        {doctor.experienceYears > 0 && (
                            <Typography sx={{ color: "#475569", fontSize: 12.5, fontWeight: 600 }}>
                                {doctor.experienceYears} năm KN
                            </Typography>
                        )}
                        {selected && (
                            <Chip
                                label="Đang chọn"
                                size="small"
                                sx={{ height: 20, fontSize: 11, fontWeight: 800, bgcolor: "#059669", color: "#FFFFFF" }}
                            />
                        )}
                    </Stack>
                    <Typography sx={{ color: "#0A2540", fontWeight: 800, fontSize: 15.5, mt: 0.35, overflowWrap: "anywhere" }}>
                        {doctor.fullName}
                    </Typography>
                    <Typography sx={{ color: "#0B4F8A", fontSize: 13, fontWeight: 650 }}>
                        {doctor.departmentName}
                    </Typography>
                </Box>
            </Stack>
        </Button>
    );
}

function SlotLegend() {
    return (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
            {[
                ["#0B4F8A", "Đang chọn"],
                ["#ECFDF5", "Còn chỗ", "#059669"],
                ["#E2E8F0", "Đã kín chỗ"],
            ].map(([color, label, border]) => (
                <Stack key={label} direction="row" spacing={0.65} sx={{ alignItems: "center" }}>
                    <Box
                        sx={{
                            width: 13,
                            height: 13,
                            borderRadius: "3px",
                            bgcolor: color,
                            border: border ? `1.5px solid ${border}` : "none",
                        }}
                    />
                    <Typography sx={{ color: "#1E293B", fontSize: 13, fontWeight: 650 }}>{label}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}

function SlotGroup({ title, slots, booking }) {
    return (
        <Stack spacing={1.25}>
            <Typography sx={{ color: "#0A2540", fontSize: 14.5, fontWeight: 800 }}>{title}</Typography>
            <Grid container spacing={1.25}>
                {slots.map(slot => {
                    const selected = booking.selectedSlot?.startTime === slot.startTime;
                    return (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={slot.startTime}>
                            <Button
                                fullWidth
                                disabled={!slot.isAvailable}
                                aria-pressed={selected}
                                onClick={() => booking.setSelectedSlot(slot)}
                                sx={{
                                    height: 60,
                                    borderRadius: "10px",
                                    fontVariantNumeric: "tabular-nums",
                                    border: selected
                                        ? "2px solid #0B4F8A"
                                        : slot.isAvailable
                                        ? "1.5px solid #059669"
                                        : "1px solid #CBD5E1",
                                    color: selected ? "#FFFFFF" : slot.isAvailable ? "#065F46" : "#64748B",
                                    bgcolor: selected ? "#0B4F8A" : slot.isAvailable ? "#ECFDF5" : "#F1F5F9",
                                    "&:hover": {
                                        bgcolor: selected ? "#083A66" : "#D1FAE5",
                                    },
                                }}
                            >
                                <Stack sx={{ alignItems: "center" }} spacing={0.15}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 15, color: "inherit" }}>
                                        {formatTime(slot.startTime)}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: selected ? "#E6F0FA" : slot.isAvailable ? "#047857" : "#64748B" }}>
                                        {selected ? "Đang chọn" : slot.isAvailable ? "Còn chỗ" : "Đã kín chỗ"}
                                    </Typography>
                                </Stack>
                            </Button>
                        </Grid>
                    );
                })}
            </Grid>
        </Stack>
    );
}

function SummaryPanel({
    booking,
    clinic,
    primaryLocation,
    currentStep,
    step1Done,
    step2Done,
    step3Done,
    onSubmit,
    onReset,
    isAuthenticated,
}) {
    const doctor = booking.selectedDoctor;
    const canSubmit = Boolean(step1Done && step2Done && step3Done);
    const checklist = [
        ["Chọn chuyên khoa & bác sĩ", step1Done],
        ["Chọn ngày & khung giờ còn chỗ", step2Done],
        ["Nhập họ tên, SĐT & lý do khám", step3Done],
    ];

    return (
        <Paper
            variant="outlined"
            sx={{
                ...clinicSurfaceSx,
                p: { xs: 2.25, sm: 3 },
                borderRadius: "16px",
                borderColor: "#90BCE6",
                borderTop: "4px solid #0B4F8A",
            }}
        >
            <Stack spacing={2.25}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <AssignmentTurnedInOutlined sx={{ color: "#0B4F8A" }} />
                        <Typography sx={{ color: "#0A2540", fontWeight: 800, fontSize: 18 }}>
                            4. Phiếu tóm tắt đặt khám
                        </Typography>
                    </Stack>
                    <Chip
                        label={canSubmit ? "Sẵn sàng gửi" : `Bước ${currentStep}/4`}
                        size="small"
                        sx={{
                            bgcolor: canSubmit ? "#ECFDF5" : "#E6F0FA",
                            color: canSubmit ? "#065F46" : "#0B4F8A",
                            fontWeight: 750,
                        }}
                    />
                </Stack>

                <Divider sx={{ borderColor: "#E2ECF5" }} />

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar
                        sx={{
                            width: 50,
                            height: 50,
                            bgcolor: "#E6F0FA",
                            color: "#0B4F8A",
                            fontWeight: 800,
                            flexShrink: 0,
                        }}
                    >
                        {doctor?.fullName?.slice(0, 1) || "BS"}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#0A2540", fontWeight: 800, fontSize: 15.5, overflowWrap: "anywhere" }}>
                            {doctor ? `${doctor.title || "BS"} ${doctor.fullName}` : "Chưa chọn bác sĩ"}
                        </Typography>
                        <Typography sx={{ color: "#0B4F8A", fontSize: 13.5, fontWeight: 700, mt: 0.25 }}>
                            {booking.selectedDepartment?.name || "Chưa chọn chuyên khoa"}
                        </Typography>
                    </Box>
                </Stack>

                <Box sx={{ p: 2, bgcolor: "#F4F7FA", borderRadius: "12px", border: "1px solid #C5D8EC" }}>
                    <Stack spacing={1.25}>
                        <SummaryRow
                            icon={<EventAvailableOutlined sx={{ fontSize: 18 }} />}
                            label="Ngày khám:"
                            value={formatDateLabel(booking.selectedDate)}
                        />
                        <SummaryRow
                            icon={<AccessTimeOutlined sx={{ fontSize: 18 }} />}
                            label="Giờ hẹn:"
                            value={
                                booking.selectedSlot
                                    ? `${formatTime(booking.selectedSlot.startTime)}${booking.selectedSlot.endTime ? ` – ${formatTime(booking.selectedSlot.endTime)}` : ""}`
                                    : "Chưa chọn"
                            }
                            highlight={Boolean(booking.selectedSlot)}
                        />
                        {primaryLocation && (
                            <SummaryRow
                                icon={<LocationOnOutlined sx={{ fontSize: 18 }} />}
                                label="Cơ sở:"
                                value={primaryLocation.name}
                            />
                        )}
                    </Stack>
                </Box>

                {/* Live Completion Checklist */}
                <Box
                    sx={{
                        p: 1.75,
                        borderRadius: "12px",
                        bgcolor: canSubmit ? "#ECFDF5" : "#F8FAFC",
                        border: `1px solid ${canSubmit ? "#6EE7B7" : "#DCE7F2"}`,
                    }}
                >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: canSubmit ? "#065F46" : "#334155", mb: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                        {canSubmit ? "Đã đủ thông tin xác nhận" : "Điều kiện để gửi lịch hẹn"}
                    </Typography>
                    <Stack spacing={0.75}>
                        {checklist.map(([label, done]) => (
                            <Stack key={label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                {done ? (
                                    <CheckCircleOutlined sx={{ fontSize: 17, color: "#059669", flexShrink: 0 }} />
                                ) : (
                                    <RadioButtonUncheckedOutlined sx={{ fontSize: 17, color: "#94A3B8", flexShrink: 0 }} />
                                )}
                                <Typography sx={{ fontSize: 13, fontWeight: done ? 700 : 500, color: done ? "#065F46" : "#475569" }}>
                                    {label}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>

                <Stack spacing={1}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                        <Typography sx={{ color: "#475569", fontSize: 13.5 }}>Phí khám ban đầu niêm yết:</Typography>
                        <Typography sx={{ color: "#0A2540", fontSize: 14, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
                            {money(clinic.defaultExaminationFee)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                        <Typography sx={{ color: "#475569", fontSize: 13.5 }}>Phí đặt lịch trực tuyến:</Typography>
                        <Typography sx={{ color: "#065F46", fontSize: 13.5, fontWeight: 800 }}>MIỄN PHÍ</Typography>
                    </Stack>
                </Stack>

                <Divider sx={{ borderColor: "#E2ECF5" }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 1 }}>
                    <Typography sx={{ color: "#0A2540", fontWeight: 800, fontSize: 16 }}>
                        Tạm tính phí khám:
                    </Typography>
                    <Typography sx={{ color: "#0B4F8A", fontWeight: 800, fontSize: 22, fontVariantNumeric: "tabular-nums" }}>
                        {money(clinic.defaultExaminationFee)}
                    </Typography>
                </Stack>

                {isAuthenticated ? (
                    <Button
                        variant="contained"
                        size="large"
                        disabled={
                            !canSubmit ||
                            booking.loading.submitting ||
                            booking.loading.slots ||
                            booking.loading.doctors
                        }
                        onClick={onSubmit}
                        endIcon={
                            booking.loading.submitting ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                <ArrowForward />
                            )
                        }
                        sx={{
                            py: 1.45,
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: 15.5,
                            bgcolor: "#0B4F8A",
                            "&:hover": { bgcolor: "#083A66" },
                        }}
                    >
                        {booking.loading.submitting ? "Đang gửi lịch hẹn..." : "Xác nhận đặt lịch khám"}
                    </Button>
                ) : (
                    <Stack spacing={1.25}>
                        <Alert severity="info" sx={{ borderRadius: "10px" }}>
                            Đăng nhập hoặc đăng ký tài khoản bệnh nhân để hoàn tất đặt lịch.
                        </Alert>
                        <Stack direction="row" spacing={1.25}>
                            <Button component={Link} to="/login" variant="contained" fullWidth>
                                Đăng nhập
                            </Button>
                            <Button component={Link} to="/register" variant="outlined" fullWidth>
                                Đăng ký
                            </Button>
                        </Stack>
                    </Stack>
                )}

                <Button
                    type="button"
                    variant="outlined"
                    startIcon={<RestartAltOutlined />}
                    onClick={onReset}
                    sx={{
                        borderRadius: "10px",
                        borderColor: "#B8CCE0",
                        color: "#0A2540",
                        fontWeight: 700,
                    }}
                >
                    Làm mới lựa chọn
                </Button>
            </Stack>
        </Paper>
    );
}

function SummaryRow({ icon, label, value, highlight = false }) {
    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ color: "#0B4F8A", display: "flex", flexShrink: 0 }}>{icon}</Box>
            <Typography sx={{ color: "#475569", fontSize: 13.5, flex: 1 }}>{label}</Typography>
            <Typography
                sx={{
                    color: highlight ? "#0B4F8A" : "#0A2540",
                    fontSize: 14,
                    fontWeight: 800,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function BookingSuccessDialog({ open, appointment, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pt: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "#ECFDF5", color: "#065F46" }}>
                        <CheckCircleOutlined />
                    </Avatar>
                    <Box>
                        <Typography sx={{ color: "#0A2540", fontSize: 20, fontWeight: 800 }}>
                            Đặt lịch khám thành công
                        </Typography>
                        <Typography sx={{ color: "#475569", fontSize: 13.5 }}>
                            Lịch hẹn của bạn đã được ghi nhận trên hệ thống phòng khám.
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box
                        sx={{
                            p: 2.5,
                            borderRadius: "12px",
                            bgcolor: "#F4F7FA",
                            border: "1px solid #C5D8EC",
                        }}
                    >
                        <Stack spacing={1.35}>
                            <PopupRow
                                label="Mã lịch hẹn"
                                value={appointment?.appointmentId ? `#${appointment.appointmentId}` : "Đang cập nhật"}
                            />
                            <PopupRow label="Bác sĩ" value={appointment?.doctorName || "Đang cập nhật"} />
                            <PopupRow label="Chuyên khoa" value={appointment?.departmentName || "Đang cập nhật"} />
                            <PopupRow label="Ngày khám" value={formatDateLabel(appointment?.appointmentDate)} />
                            <PopupRow
                                label="Giờ khám"
                                value={appointment?.startTime ? formatTime(appointment.startTime) : "Đang cập nhật"}
                            />
                            <PopupRow
                                label="Trạng thái"
                                value={<StatusBadge status={appointment?.status || "Pending"} />}
                            />
                        </Stack>
                    </Box>

                    <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#EAF2FA", color: "#0A2540" }}>
                        <strong>Bước tiếp theo:</strong> Chờ lễ tân xác nhận lịch. Khi đến khám, vui lòng có mặt trước{" "}
                        <strong>10–15 phút</strong> tại quầy lễ tân kèm sổ khám giấy (hoặc làm thủ tục mua/cấp lại sổ tại quầy).
                    </Alert>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, flexWrap: "wrap", gap: 1 }}>
                <Button
                    component={Link}
                    to="/my-appointments"
                    variant="outlined"
                    onClick={onClose}
                    sx={{ borderRadius: "10px", fontWeight: 700 }}
                >
                    Lịch hẹn của tôi
                </Button>
                <Button variant="contained" onClick={onClose} sx={{ minWidth: 130, borderRadius: "10px", fontWeight: 750 }}>
                    Đã hiểu
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function PopupRow({ label, value }) {
    return (
        <Stack direction="row" sx={{ justifyContent: "space-between" }} spacing={2}>
            <Typography sx={{ color: "#475569", fontSize: 14.5 }}>{label}</Typography>
            <Typography component="div" sx={{ color: "#0A2540", fontSize: 14.5, fontWeight: 750, textAlign: "right" }}>
                {value}
            </Typography>
        </Stack>
    );
}

function InlineLoading({ text = "Đang tải dữ liệu..." }) {
    return (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", py: 1 }}>
            <CircularProgress size={18} />
            <Typography sx={{ color: "#475569", fontSize: 14.5 }}>{text}</Typography>
        </Stack>
    );
}

export default BookingPage;
