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
    MedicalInformationOutlined,
    StarOutlineRounded,
    WorkspacePremiumOutlined,
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
        ? doctor.fullName
              .trim()
              .split(" ")
              .slice(-2)
              .map(n => n[0])
              .join("")
              .toUpperCase()
        : "BS";

    const availableSlots = (slots.data || []).filter(slot => slot.isAvailable);

    return (
        <PublicPage
            badge="Hồ sơ chuyên môn bác sĩ"
            title={doctor ? `${doctor.title} ${doctor.fullName}`.trim() : "Hồ sơ bác sĩ"}
            description={
                doctor?.departmentName
                    ? `Bác sĩ điều trị tại chuyên khoa ${doctor.departmentName} — Xem thông tin kinh nghiệm, phòng khám và khung giờ tiếp nhận trực tuyến.`
                    : undefined
            }
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
                                    borderColor: "#C5D8EC",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "0 2px 10px rgba(10, 37, 64, 0.04)",
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2.5}
                                    sx={{ alignItems: { sm: "center" }, mb: 3 }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 78,
                                            height: 78,
                                            bgcolor: "#E6F0FA",
                                            color: "#0B4F8A",
                                            fontSize: 24,
                                            fontWeight: 800,
                                            border: "2px solid #90BCE6",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {initials}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75, mb: 0.75 }}>
                                            <Chip
                                                size="small"
                                                label={doctor.departmentName}
                                                sx={{
                                                    bgcolor: "#E6F0FA",
                                                    color: "#0B4F8A",
                                                    fontWeight: 750,
                                                    fontSize: 12.5,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                icon={<WorkspacePremiumOutlined sx={{ fontSize: 16 }} />}
                                                label={
                                                    doctor.experienceYears
                                                        ? `${doctor.experienceYears} năm kinh nghiệm`
                                                        : "Bác sĩ chuyên khoa"
                                                }
                                                sx={{
                                                    bgcolor: "#F1F5F9",
                                                    color: "#0A2540",
                                                    fontWeight: 700,
                                                    fontSize: 12.5,
                                                }}
                                            />
                                        </Stack>
                                        <Typography
                                            component="h2"
                                            variant="h5"
                                            sx={{ fontWeight: 800, fontSize: { xs: 22, sm: 25 }, color: "#0A2540" }}
                                        >
                                            {doctor.title} {doctor.fullName}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 2.5, borderColor: "#E2ECF5" }} />

                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.25 }}>
                                    <MedicalInformationOutlined sx={{ color: "#0B4F8A", fontSize: 21 }} />
                                    <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 17.5, color: "#0A2540" }}>
                                        Giới thiệu chuyên môn
                                    </Typography>
                                </Stack>
                                <Typography
                                    sx={{
                                        lineHeight: 1.85,
                                        fontSize: 15,
                                        color: "#1E293B",
                                        whiteSpace: "pre-line",
                                        overflowWrap: "anywhere",
                                        mb: 3,
                                    }}
                                >
                                    {doctor.biography || "Bác sĩ chưa cập nhật thông tin giới thiệu chi tiết."}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.25 }}>
                                    <LocationOnOutlined sx={{ color: "#0B4F8A", fontSize: 21 }} />
                                    <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 17.5, color: "#0A2540" }}>
                                        Phòng khám tiếp nhận sắp tới
                                    </Typography>
                                </Stack>
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
                                                    borderColor: "#90BCE6",
                                                    bgcolor: "#E6F0FA",
                                                    color: "#0A2540",
                                                    fontWeight: 700,
                                                    fontSize: 13.5,
                                                }}
                                            />
                                        ))
                                    )}
                                </Stack>

                                <Divider sx={{ my: 2.5, borderColor: "#E2ECF5" }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <Button
                                        component={Link}
                                        to={`/reviews?doctorId=${doctor.doctorId}`}
                                        variant="outlined"
                                        startIcon={<StarOutlineRounded />}
                                        sx={{
                                            borderRadius: "10px",
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderColor: "#B8CCE0",
                                            color: "#0A2540",
                                        }}
                                    >
                                        Xem đánh giá bệnh nhân
                                    </Button>
                                    <Button
                                        component={Link}
                                        to={`/specialties/${doctor.departmentId}`}
                                        variant="text"
                                        sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 750, color: "#0B4F8A" }}
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
                                    borderColor: "#90BCE6",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "0 4px 16px rgba(10, 37, 64, 0.06)",
                                    position: { md: "sticky" },
                                    top: 108,
                                }}
                            >
                                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: "10px",
                                            bgcolor: "#0B4F8A",
                                            color: "#FFFFFF",
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <CalendarMonthOutlined sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 18.5, color: "#0A2540" }}>
                                            Lịch khám còn trống
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: "#0B4F8A", fontWeight: 700 }}>
                                            Cập nhật theo ca trực bác sĩ
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="body2" sx={{ mb: 2, fontSize: 14, color: "#334155" }}>
                                    Chọn ngày khám dự kiến để xem các khung giờ tiếp nhận:
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
                                    {availableSlots.length > 0 ? (
                                        <Box sx={{ mb: 2.5 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{ display: "block", mb: 1.25, fontWeight: 750, color: "#0B4F8A", fontSize: 13 }}
                                            >
                                                Còn {availableSlots.length} khung giờ trống:
                                            </Typography>
                                            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                                                {availableSlots.map(slot => (
                                                    <Chip
                                                        key={slot.startTime}
                                                        icon={<AccessTimeOutlined sx={{ fontSize: 15 }} />}
                                                        label={slot.startTime.slice(0, 5)}
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: "8px",
                                                            fontWeight: 750,
                                                            fontSize: 13.5,
                                                            height: 34,
                                                            bgcolor: "#E6F0FA",
                                                            borderColor: "#90BCE6",
                                                            color: "#0A2540",
                                                            fontVariantNumeric: "tabular-nums",
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

                                <Typography
                                    variant="body2"
                                    sx={{ mb: 3, fontSize: 13, lineHeight: 1.6, color: "#475569" }}
                                >
                                    Giờ Việt Nam (UTC+7). Số lượng chỗ trống được cập nhật theo thời gian thực khi bạn gửi đăng ký.
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
                                        py: 1.4,
                                        fontWeight: 750,
                                        fontSize: 15.5,
                                        textTransform: "none",
                                        bgcolor: "#0B4F8A",
                                        "&:hover": { bgcolor: "#083A66" },
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
                    sx={{ textTransform: "none", fontWeight: 750, borderRadius: "10px", color: "#0B4F8A" }}
                >
                    Về danh sách bác sĩ
                </Button>
            </Box>
        </PublicPage>
    );
}
