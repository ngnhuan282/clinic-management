import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Avatar, Box, Button, Chip, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
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
    const loadSlots = useCallback(() => date >= clinicToday() ? getAvailableSlots(doctorId, date) : Promise.resolve([]), [doctorId, date]);
    const slots = usePublicResource(loadSlots);
    const doctor = resource.data;
    const bookingUrl = doctor ? `/booking?departmentId=${doctor.departmentId}&doctorId=${doctor.doctorId}` : "/booking";
    return <PublicPage title={doctor ? `${doctor.title} ${doctor.fullName}`.trim() : "Hồ sơ bác sĩ"} description={doctor?.departmentName}>
        <ResourceState resource={resource}>{doctor && <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}><Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction="row"  spacing={2}  sx={{ alignItems: "center", mb: 3 }}><Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>BS</Avatar>
                    <Box><Typography component="h2" variant="h6"  sx={{ fontWeight: 750 }}>{doctor.title} {doctor.fullName}</Typography><Typography color="text.secondary">{doctor.experienceYears} năm kinh nghiệm</Typography></Box></Stack>
                <Typography component="h2" variant="h6"   sx={{ fontWeight: 700, mb: 1 }}>Giới thiệu</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{doctor.biography || "Bác sĩ chưa cập nhật thông tin giới thiệu."}</Typography>
                <Typography component="h2" variant="h6"    sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Phòng khám sắp tới</Typography>
                <Stack direction="row"   sx={{ flexWrap: "wrap", gap: 1 }}>{doctor.rooms.map(room => <Chip key={room.roomId} label={`${room.roomCode} – ${room.roomName}`} variant="outlined" />)}</Stack>
                {!doctor.rooms.length && <Typography color="text.secondary">Chưa có phòng khám được công bố.</Typography>}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}  sx={{ mt: 3 }}><Button component={Link} to={`/reviews?doctorId=${doctor.doctorId}`} variant="outlined">Xem đánh giá</Button><Button component={Link} to={`/specialties/${doctor.departmentId}`}>Thông tin chuyên khoa</Button></Stack>
            </Paper></Grid>
            <Grid size={{ xs: 12, md: 5 }}><Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 2 }}>Lịch khám còn trống</Typography>
                <TextField label="Ngày khám" type="date" value={date} onChange={e => setDate(e.target.value)} fullWidth sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: clinicToday() } }} />
                <ResourceState resource={slots}>{slots.data?.some(slot => slot.isAvailable) ? <Stack direction="row"   sx={{ gap: 1, flexWrap: "wrap" }}>{slots.data.filter(slot => slot.isAvailable).map(slot => <Chip key={slot.startTime} label={slot.startTime.slice(0, 5)} color="primary" variant="outlined" />)}</Stack> : <Alert severity="info">Chưa có giờ trống trong ngày này. Vui lòng chọn ngày khác.</Alert>}</ResourceState>
                <Typography color="text.secondary" variant="body2" sx={{ my: 2 }}>Giờ Việt Nam (UTC+7). Giờ trống có thể thay đổi trước khi hoàn tất đăng ký.</Typography>
                <Button component={Link} to={`${bookingUrl}&date=${encodeURIComponent(date)}`} variant="contained" fullWidth>Đặt khám với bác sĩ</Button>
            </Paper></Grid>
        </Grid>}</ResourceState>
        <Button component={Link} to="/doctors" sx={{ mt: 3 }}>Về danh sách bác sĩ</Button>
    </PublicPage>;
}
