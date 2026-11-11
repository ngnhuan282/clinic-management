import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * @param {{ doctor: import("../../api/doctorApi").PublicDoctor }} props
 */
function PublicDoctorCard({ doctor }) {
    return (
        <Paper variant="outlined" sx={{ p: 2.5, height: "100%", borderRadius: 3 }}>
            <Stack spacing={1.25}>
                <Box>
                    <Typography component="h3" variant="h6" color="text.primary" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                        {doctor.title} {doctor.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {doctor.departmentName} · {doctor.experienceYears} năm kinh nghiệm
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Button component={Link} to={`/doctors/${doctor.doctorId}`} variant="outlined">Hồ sơ bác sĩ</Button>
                    <Button component={Link} to={`/booking?departmentId=${doctor.departmentId}&doctorId=${doctor.doctorId}`} variant="contained">Đặt khám</Button>
                    <Button component={Link} to={`/reviews?doctorId=${doctor.doctorId}`}>Xem đánh giá</Button>
                </Stack>

                {doctor.biography && (
                    <Typography variant="body2" color="text.secondary"
                        sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {doctor.biography}
                    </Typography>
                )}

                <Box>
                    <Typography variant="caption" color="text.secondary"  sx={{ fontWeight: 600 }}>
                        Phòng khám sắp tới
                    </Typography>
                    <Stack direction="row" sx={{ mt: 0.5, gap: 1, flexWrap: "wrap" }}>
                        {doctor.rooms.length === 0 && (
                            <Typography variant="body2" color="text.secondary">Chưa có lịch khám</Typography>
                        )}
                        {doctor.rooms.map(room => (
                            <Chip key={room.roomId} size="small" color="primary" variant="outlined"
                                label={`${room.roomCode} - ${room.roomName}`} />
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}

export default PublicDoctorCard;
