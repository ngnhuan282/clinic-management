import { Avatar, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { CalendarMonthOutlined, LocationOnOutlined, StarOutlineRounded } from "@mui/icons-material";
import { Link } from "react-router-dom";

/**
 * @param {{ doctor: import("../../api/doctorApi").PublicDoctor }} props
 */
function PublicDoctorCard({ doctor }) {
    // Generate initials for avatar
    const initials = doctor.fullName
        ? doctor.fullName.trim().split(" ").slice(-2).map(n => n[0]).join("").toUpperCase()
        : "BS";

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.75,
                height: "100%",
                borderRadius: "14px",
                borderColor: "#e5e9f0",
                bgcolor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    borderColor: "#90caf9",
                    transform: "translateY(-3px)",
                    boxShadow: "0 10px 24px rgba(25, 118, 210, 0.09)",
                },
            }}
        >
            <Stack spacing={2} sx={{ flex: 1 }}>
                {/* Header: Avatar + Name + Specialty */}
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                    <Avatar
                        sx={{
                            width: 52,
                            height: 52,
                            bgcolor: "#e0f2fe",
                            color: "primary.main",
                            fontWeight: 750,
                            fontSize: 16,
                            border: "2px solid #bae6fd",
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
                                fontWeight: 750,
                                fontSize: 16.5,
                                color: "#1f2937",
                                lineHeight: 1.3,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {doctor.title} {doctor.fullName}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="primary.main"
                            sx={{ fontWeight: 600, fontSize: 13.5, mt: 0.4 }}
                        >
                            {doctor.departmentName}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.2, fontSize: 12 }}
                        >
                            {doctor.experienceYears ? `${doctor.experienceYears} năm kinh nghiệm` : "Bác sĩ chuyên khoa"}
                        </Typography>
                    </Box>
                </Stack>

                {/* Biography snippet */}
                {doctor.biography && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            fontSize: 13.5,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            color: "#4b5563",
                        }}
                    >
                        {doctor.biography}
                    </Typography>
                )}

                {/* Rooms info */}
                <Box sx={{ mt: "auto", pt: 1 }}>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 650,
                            fontSize: 12,
                            color: "#64748b",
                            mb: 0.75,
                        }}
                    >
                        <LocationOnOutlined sx={{ fontSize: 14 }} />
                        Phòng khám sắp tới
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
                        {doctor.rooms.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, fontStyle: "italic" }}>
                                Chưa có lịch phòng khám
                            </Typography>
                        ) : (
                            doctor.rooms.map(room => (
                                <Chip
                                    key={room.roomId}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    label={`${room.roomCode} - ${room.roomName}`}
                                    sx={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        bgcolor: "#f0f9ff",
                                        borderColor: "#bae6fd",
                                        borderRadius: "6px",
                                    }}
                                />
                            ))
                        )}
                    </Stack>
                </Box>
            </Stack>

            <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Button
                    component={Link}
                    to={`/booking?departmentId=${doctor.departmentId}&doctorId=${doctor.doctorId}`}
                    variant="contained"
                    size="small"
                    startIcon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
                    sx={{
                        flex: 1,
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: 13,
                        py: 0.9,
                        textTransform: "none",
                        boxShadow: "0 2px 6px rgba(25, 118, 210, 0.2)",
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
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: 13,
                        py: 0.9,
                        borderColor: "#cbd5e1",
                        color: "#334155",
                        textTransform: "none",
                        "&:hover": { borderColor: "primary.main", bgcolor: "#eff6ff" },
                    }}
                >
                    Hồ sơ
                </Button>
                <Button
                    component={Link}
                    to={`/reviews?doctorId=${doctor.doctorId}`}
                    size="small"
                    aria-label="Xem đánh giá của bác sĩ"
                    sx={{
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: 13,
                        py: 0.9,
                        color: "#64748b",
                        minWidth: 0,
                        px: 1.25,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#f8fafc", color: "primary.main" },
                    }}
                >
                    <StarOutlineRounded sx={{ fontSize: 18 }} />
                </Button>
            </Stack>
        </Paper>
    );
}

export default PublicDoctorCard;
