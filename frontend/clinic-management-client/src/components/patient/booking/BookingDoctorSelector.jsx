import { Avatar, Box, Button, Chip, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { BadgeOutlined, CheckCircleOutlineOutlined, LocalHospitalOutlined } from "@mui/icons-material";
import { bookingColors as colors, bookingFieldSx, bookingPanelSx, bookingSectionTitleSx } from "./bookingUi";

export default function BookingDoctorSelector({ booking }) {
    return <Paper elevation={0} sx={bookingPanelSx}>
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: colors.blueSoft, color: colors.primary }}><LocalHospitalOutlined fontSize="small" /></Avatar>
                <Box>
                    <Typography component="h2" sx={bookingSectionTitleSx}>1. Chọn Chuyên Khoa Khám</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: 13 }}>Chọn chuyên khoa phù hợp để tìm bác sĩ.</Typography>
                </Box>
            </Stack>
            <TextField select fullWidth size="small" label="Chuyên khoa" value={booking.selectedDepartmentId}
                disabled={booking.loading.departments} sx={bookingFieldSx}
                onChange={event => booking.setSelectedDepartmentId(event.target.value)}>
                {booking.departments.map(department => <MenuItem key={department.departmentId} value={department.departmentId}>{department.name}</MenuItem>)}
            </TextField>
            {booking.loading.departments && <Skeleton variant="rounded" height={42} />}
            {!booking.loading.departments && !booking.departments.length && <Typography sx={{ color: colors.muted, fontSize: 14 }}>Chưa có chuyên khoa khả dụng.</Typography>}
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: colors.blueSoft, color: colors.primary }}><BadgeOutlined fontSize="small" /></Avatar>
                <Box>
                    <Typography component="h2" sx={bookingSectionTitleSx}>2. Chọn Bác Sĩ</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: 13 }}>Chọn bác sĩ bạn muốn đặt lịch khám</Typography>
                </Box>
            </Stack>
            {booking.loading.doctors ? <Skeleton variant="rounded" height={100} aria-label="Đang tải bác sĩ" />
                : !booking.selectedDepartmentId ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chọn chuyên khoa để xem bác sĩ.</Typography>
                    : !booking.doctors.length ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chuyên khoa này chưa có bác sĩ để đặt lịch.</Typography>
                        : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                            {booking.doctors.map(doctor => {
                                const selected = Number(booking.selectedDoctorId) === doctor.doctorId;
                                return <Button key={doctor.doctorId} fullWidth aria-pressed={selected} variant="outlined"
                                    onClick={() => booking.setSelectedDoctorId(String(doctor.doctorId))}
                                    sx={{ p: 1.5, minHeight: 102, justifyContent: "flex-start", textAlign: "left", minWidth: 0,
                                        borderRadius: 2, textTransform: "none", borderColor: selected ? colors.primary : colors.borderStrong,
                                        bgcolor: selected ? colors.blueSoft : colors.paper, color: colors.heading,
                                        "&:hover": { borderColor: colors.primary, bgcolor: colors.blueSoft } }}>
                                    <Avatar sx={{ mr: 1.5, width: 54, height: 54, flexShrink: 0, bgcolor: colors.blueSoft, color: colors.primaryDark, fontWeight: 800 }}>{doctor.fullName?.slice(0, 1)}</Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                            {doctor.title && <Chip component="span" label={doctor.title} size="small" sx={{ height: 22, bgcolor: colors.primary, color: colors.onPrimary, fontWeight: 800 }} />}
                                            {doctor.experienceYears != null && <Typography component="span" sx={{ fontSize: 12, color: colors.muted }}>{doctor.experienceYears} năm kinh nghiệm</Typography>}
                                        </Stack>
                                        <Typography component="span" sx={{ display: "block", mt: 0.5, fontWeight: 800, fontSize: 16, overflowWrap: "anywhere" }}>{doctor.fullName}</Typography>
                                        <Typography component="span" sx={{ display: "block", fontSize: 13, color: colors.primary }}>{doctor.departmentName || booking.selectedDepartment?.name}</Typography>
                                    </Box>
                                    {selected && <CheckCircleOutlineOutlined sx={{ ml: 1, fontSize: 20, flexShrink: 0, color: colors.primary }} />}
                                </Button>;
                            })}
                        </Box>}
        </Stack>
    </Paper>;
}
