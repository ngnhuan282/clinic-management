import { Avatar, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import {
    CalendarMonthOutlined,
    LocationOnOutlined,
    StarOutlineRounded,
    WorkspacePremiumOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

/**
 * @param {{ doctor: import("../../api/doctorApi").PublicDoctor }} props
 */
function PublicDoctorCard({ doctor }) {
    const initials = doctor.fullName
        ? doctor.fullName
            .trim()
            .split(" ")
            .slice(-2)
            .map(n => n[0])
            .join("")
            .toUpperCase()
        : "BS";

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.75,
                height: "100%",
                borderRadius: "14px",
                borderColor: "#C5D8EC",
                borderTop: "4px solid #0B4F8A",
                bgcolor: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 8px rgba(10, 37, 64, 0.04)",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                    borderColor: "#0B4F8A",
                    boxShadow: "0 8px 20px rgba(10, 37, 64, 0.09)",
                },
            }}
        >
            <Stack spacing={2} sx={{ flex: 1 }}>
                {/* Header: Avatar + Name + Specialty */}
                <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: "#E6F0FA",
                            color: "#0B4F8A",
                            fontWeight: 800,
                            fontSize: 17,
                            border: "2px solid #90BCE6",
                            flexShrink: 0,
                        }}
                    >
                        {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            component="h3"
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                fontSize: 17,
                                color: "#0A2540",
                                lineHeight: 1.32,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {doctor.title} {doctor.fullName}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, fontSize: 14, mt: 0.4, color: "#0B4F8A" }}
                        >
                            {doctor.departmentName}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5, color: "#334155" }}>
                            <WorkspacePremiumOutlined sx={{ fontSize: 15, color: "#0B4F8A" }} />
                            <Typography variant="caption" sx={{ fontSize: 12.5, fontWeight: 650 }}>
                                {doctor.experienceYears
                                    ? `${doctor.experienceYears} năm kinh nghiệm`
                                    : "Bác sĩ chuyên khoa"}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>

                {/* Biography snippet */}
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: "#334155",
                    }}
                >
                    {doctor.biography || "Tham khảo lịch làm việc thực tế và đặt hẹn khám trực tiếp với bác sĩ."}
                </Typography>

                {/* Rooms info */}
                <Box sx={{ mt: "auto", pt: 0.5 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: "#475569",
                            mb: 0.75,
                        }}
                    >
                        <LocationOnOutlined sx={{ fontSize: 15, color: "#0B4F8A" }} />
                        Phòng khám tiếp nhận
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
                        {doctor.rooms.length === 0 ? (
                            <Typography variant="body2" sx={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>
                                Chưa cập nhật lịch phòng khám
                            </Typography>
                        ) : (
                            doctor.rooms.map(room => (
                                <Chip
                                    key={room.roomId}
                                    size="small"
                                    variant="outlined"
                                    label={`${room.roomCode} - ${room.roomName}`}
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 650,
                                        bgcolor: "#E6F0FA",
                                        borderColor: "#90BCE6",
                                        color: "#0A2540",
                                        borderRadius: "6px",
                                    }}
                                />
                            ))
                        )}
                    </Stack>
                </Box>
            </Stack>

            <Divider sx={{ my: 2, borderColor: "#E2ECF5" }} />

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                <Button
                    component={Link}
                    to={`/booking?departmentId=${doctor.departmentId}&doctorId=${doctor.doctorId}`}
                    variant="contained"
                    size="small"
                    startIcon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
                    sx={{
                        flex: 1,
                        minWidth: 112,
                        minHeight: 40,
                        borderRadius: "8px",
                        fontWeight: 750,
                        fontSize: 13.5,
                        textTransform: "none",
                        bgcolor: "#0B4F8A",
                        "&:hover": { bgcolor: "#083A66" },
                    }}
                >
                    Đặt khám
                </Button>
                <Button
                    component={Link}
                    to={`/doctors/${doctor.doctorId}`}
                    variant="outlined"
                    size="small"
                    sx={{
                        minHeight: 40,
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: 13.5,
                        px: 1.5,
                        borderColor: "#B8CCE0",
                        color: "#0A2540",
                        textTransform: "none",
                        "&:hover": { borderColor: "#0B4F8A", bgcolor: "#E6F0FA", color: "#0B4F8A" },
                    }}
                >
                    Hồ sơ bác sĩ
                </Button>
                <Button
                    component={Link}
                    to={`/reviews?doctorId=${doctor.doctorId}`}
                    size="small"
                    aria-label="Xem đánh giá của bác sĩ"
                    sx={{
                        minHeight: 40,
                        borderRadius: "8px",
                        fontWeight: 650,
                        fontSize: 13,
                        color: "#92400E",
                        bgcolor: "#FFFBEB",
                        border: "1px solid #FCD34D",
                        minWidth: 40,
                        px: 1,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#FEF3C7" },
                    }}
                >
                    <StarOutlineRounded sx={{ fontSize: 19 }} />
                </Button>
            </Stack>
        </Paper>
    );
}

export default PublicDoctorCard;
