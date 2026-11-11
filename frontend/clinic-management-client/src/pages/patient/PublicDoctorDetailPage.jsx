import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    ArrowBack,
    CalendarMonthOutlined,
    LocationOnOutlined,
    StarOutlineRounded,
} from "@mui/icons-material";
import { getPublicDoctor } from "../../api/publicApi";
import { getAvailableSlots } from "../../api/bookingApi";
import usePublicResource from "../../hooks/usePublicResource";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import { clinicToday } from "../../utils/publicBooking";

export default function PublicDoctorDetailPage() {
    const { doctorId } = useParams();
    const [date, setDate] = useState(clinicToday);
    const loadDoctor = useCallback(() => getPublicDoctor(doctorId), [doctorId]);
    const resource = usePublicResource(loadDoctor);
    const loadSlots = useCallback(
        () => (date >= clinicToday() ? getAvailableSlots(doctorId, date) : Promise.resolve([])),
        [doctorId, date]
    );
    const slots = usePublicResource(loadSlots);
    const doctor = resource.data;
    const bookingUrl = doctor
        ? `/booking?departmentId=${doctor.departmentId}&doctorId=${doctor.doctorId}`
        : "/booking";

    const initials = doctor?.fullName
        ? doctor.fullName.trim().split(" ").slice(-2).map(n => n[0]).join("").toUpperCase()
        : "BS";

    return (
        <PublicPage
            title={doctor ? `${doctor.title} ${doctor.fullName}`.trim() : "Hồ sơ bác sĩ"}
            description={doctor?.departmentName ? `Bác sĩ chuyên khoa ${doctor.departmentName}` : undefined}
        >
            <ResourceState resource={resource}>
                {doctor && (
                    <Grid container spacing={3}>
                        {/* Left Column: Doctor Profile Details */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: { xs: 3, md: 4 },
                                    borderRadius: "16px",
                                    borderColor: "#e5e9f0",
                                    bgcolor: "#ffffff",
                                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                                }}
                            >
                                <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 3 }}>
                                    <Avatar
                                        sx={{
                                            width: 72,
                                            height: 72,
                                            bgcolor: "#e0f2fe",
                                            color: "primary.main",
                                            fontSize: 22,
                                            fontWeight: 800,
                                            border: "3px solid #bae6fd",
                                        }}
                                    >
                                        {initials}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            component="h2"
                                            variant="h5"
                                            sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 }, color: "#0f2c4d" }}
                                        >
                                            {doctor.title} {doctor.fullName}
                                        </Typography>
                                        <Typography color="primary.main" sx={{ fontWeight: 650, fontSize: 15, mt: 0.5 }}>
                                            {doctor.departmentName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                            {doctor.experienceYears ? `${doctor.experienceYears} năm kinh nghiệm chuyên môn` : "Bác sĩ chuyên khoa"}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 2.5, borderColor: "#f1f5f9" }} />

                                <Typography component="h3" variant="h6" sx={{ fontWeight: 750, fontSize: 17, color: "#1f2937", mb: 1.25 }}>
                                    Giới thiệu chuyên môn
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.85, fontSize: 14.5, whiteSpace: "pre-line", overflowWrap: "anywhere", mb: 3 }}
                                >
                                    {doctor.biography || "Bác sĩ chưa cập nhật thông tin giới thiệu chi tiết."}
                                </Typography>

                                <Typography component="h3" variant="h6" sx={{ fontWeight: 750, fontSize: 17, color: "#1f2937", mb: 1.25 }}>
                                    Phòng khám sắp tới
                                </Typography>
                                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 3 }}>
                                    {doctor.rooms.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Chưa có thông tin phòng khám tiếp nhận.
                                        </Typography>
                                    ) : (
                                        doctor.rooms.map(room => (
                                            <Chip
                                                key={room.roomId}
                                                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                                                label={`${room.roomCode} – ${room.roomName}`}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: "8px",
                                                    borderColor: "#cbd5e1",
                                                    bgcolor: "#f8fafc",
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                }}
                                            />
                                        ))
                                    )}
                                </Stack>

                                <Divider sx={{ my: 2.5, borderColor: "#f1f5f9" }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <Button
                                        component={Link}
                                        to={`/reviews?doctorId=${doctor.doctorId}`}
                                        variant="outlined"
                                        startIcon={<StarOutlineRounded />}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, borderColor: "#cbd5e1", color: "#334155" }}
                                    >
                                        Xem đánh giá bệnh nhân
                                    </Button>
                                    <Button
                                        component={Link}
                                        to={`/specialties/${doctor.departmentId}`}
                                        variant="text"
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650 }}
                                    >
                                        Xem chuyên khoa {doctor.departmentName}
                                    </Button>
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Right Column: Appointment Slots Picker */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: { xs: 3, md: 3.5 },
                                    borderRadius: "16px",
                                    borderColor: "#e5e9f0",
                                    bgcolor: "#ffffff",
                                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                                    position: { md: "sticky" },
                                    top: 100,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
                                    <CalendarMonthOutlined />
                                    <Typography component="h3" variant="h6" sx={{ fontWeight: 750, fontSize: 18, color: "#0f2c4d" }}>
                                        Lịch khám còn trống
                                    </Typography>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13.5 }}>
                                    Chọn ngày khám để xem các khung giờ tiếp nhận của bác sĩ:
                                </Typography>

                                <TextField
                                    label="Ngày khám"
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={{ mb: 2.5 }}
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                        htmlInput: { min: clinicToday() },
                                    }}
                                />

                                <ResourceState resource={slots}>
                                    {slots.data?.some(slot => slot.isAvailable) ? (
                                        <Box sx={{ mb: 2.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                                                Các khung giờ còn trống (UTC+7):
                                            </Typography>
                                            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                                                {slots.data
                                                    .filter(slot => slot.isAvailable)
                                                    .map(slot => (
                                                        <Chip
                                                            key={slot.startTime}
                                                            icon={<AccessTimeOutlined sx={{ fontSize: 14 }} />}
                                                            label={slot.startTime.slice(0, 5)}
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{
                                                                borderRadius: "8px",
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                bgcolor: "#eff6ff",
                                                                borderColor: "#bfdbfe",
                                                            }}
                                                        />
                                                    ))}
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Alert severity="info" sx={{ borderRadius: "10px", mb: 2.5 }}>
                                            Chưa có khung giờ trống trong ngày này. Vui lòng chọn ngày khác.
                                        </Alert>
                                    )}
                                </ResourceState>

                                <Typography color="text.secondary" variant="body2" sx={{ mb: 3, fontSize: 12.5, lineHeight: 1.6 }}>
                                    Giờ khám tính theo múi giờ Việt Nam. Số lượng chỗ có thể thay đổi trước khi bạn hoàn tất đăng ký.
                                </Typography>

                                <Button
                                    component={Link}
                                    to={`${bookingUrl}&date=${encodeURIComponent(date)}`}
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    startIcon={<CalendarMonthOutlined />}
                                    sx={{
                                        borderRadius: "10px",
                                        py: 1.25,
                                        fontWeight: 700,
                                        fontSize: 15,
                                        textTransform: "none",
                                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.25)",
                                    }}
                                >
                                    Đặt khám với bác sĩ
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </ResourceState>

            <Box sx={{ mt: 4 }}>
                <Button
                    component={Link}
                    to="/doctors"
                    startIcon={<ArrowBack />}
                    sx={{ textTransform: "none", fontWeight: 650, borderRadius: "8px" }}
                >
                    Về danh sách bác sĩ
                </Button>
            </Box>
        </PublicPage>
    );
}
