import { Avatar, Box, Button, MenuItem, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { CheckCircleOutlineOutlined } from "@mui/icons-material";
import { appointmentButtonSx, appointmentColors as colors, appointmentFieldSx } from "../../appointments/appointmentUi";

export default function BookingDoctorSelector({ booking }) {
    return <Stack spacing={2}>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>1. Chọn chuyên khoa</Typography>
        <TextField select fullWidth size="small" label="Chuyên khoa" value={booking.selectedDepartmentId}
            disabled={booking.loading.departments} sx={appointmentFieldSx}
            onChange={event => booking.setSelectedDepartmentId(event.target.value)}>
            {booking.departments.map(department => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}
        </TextField>
        {booking.loading.departments && <Skeleton variant="rounded" height={42} />}
        {!booking.loading.departments && !booking.departments.length && <Typography color="text.secondary" fontSize={14}>Chưa có chuyên khoa khả dụng.</Typography>}
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>2. Chọn bác sĩ</Typography>
        {booking.loading.doctors ? <Skeleton variant="rounded" height={80} aria-label="Đang tải bác sĩ" />
            : !booking.selectedDepartmentId ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chọn chuyên khoa để xem bác sĩ.</Typography>
                : !booking.doctors.length ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chuyên khoa này chưa có bác sĩ để đặt lịch.</Typography>
                    : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                        {booking.doctors.map(doctor => {
                            const selected = Number(booking.selectedDoctorId) === doctor.doctorId;
                            return <Button key={doctor.doctorId} aria-pressed={selected} variant="outlined"
                                onClick={() => booking.setSelectedDoctorId(String(doctor.doctorId))}
                                sx={{ ...appointmentButtonSx, p: 1.5, justifyContent: "flex-start", textAlign: "left", minWidth: 0,
                                    borderColor: selected ? colors.primary : colors.border,
                                    bgcolor: selected ? colors.primarySoft : colors.paper, color: colors.heading }}>
                                <Avatar sx={{ mr: 1.5, bgcolor: colors.primarySoft, color: colors.primary }}>{doctor.fullName?.slice(0, 1)}</Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography component="span" sx={{ display: "block", fontWeight: 600, fontSize: 15, overflowWrap: "anywhere" }}>{doctor.fullName}</Typography>
                                    <Typography component="span" sx={{ display: "block", fontSize: 13, color: colors.muted }}>{doctor.title || doctor.departmentName}</Typography>
                                    {doctor.experienceYears != null && <Typography component="span" sx={{ display: "block", fontSize: 12, color: colors.muted }}>{doctor.experienceYears} năm kinh nghiệm</Typography>}
                                </Box>
                                {selected && <CheckCircleOutlineOutlined sx={{ ml: 1, fontSize: 20, color: colors.primary }} />}
                            </Button>;
                        })}
                    </Box>}
    </Stack>;
}
