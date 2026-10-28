import { useEffect, useState } from "react";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import { ArrowBackOutlined, CalendarMonthOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import useBooking from "../../hooks/useBooking";
import AppointmentArrivalGuide from "../../components/patient/AppointmentArrivalGuide";
import BookingProgress from "../../components/patient/booking/BookingProgress";
import BookingDoctorSelector from "../../components/patient/booking/BookingDoctorSelector";
import BookingScheduleSelector from "../../components/patient/booking/BookingScheduleSelector";
import BookingPatientForm from "../../components/patient/booking/BookingPatientForm";
import BookingSummary from "../../components/patient/booking/BookingSummary";
import BookingSuccessDialog from "../../components/patient/booking/BookingSuccessDialog";
import { bookingColors as colors } from "../../components/patient/booking/bookingUi";
import { appointmentButtonSx } from "../../components/appointments/appointmentUi";

function getCurrentStep(booking) {
    const completed = [booking.selectedDepartmentId, booking.selectedDoctorId, booking.selectedDate,
        booking.selectedSlot, booking.patientName.trim() && booking.patientPhone.trim() && booking.reason.trim()];
    const next = completed.findIndex(value => !value);
    return next === -1 ? 6 : next + 1;
}

export default function BookingPage() {
    const booking = useBooking();
    const currentStep = getCurrentStep(booking);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const successAppointmentId = booking.successAppointment?.appointmentId;

    useEffect(() => {
        if (!successAppointmentId) return;
        const timer = setTimeout(() => setSuccessDialogOpen(true), 0);
        return () => clearTimeout(timer);
    }, [successAppointmentId]);

    return <Box className="appointment-workspace booking-page" sx={{ bgcolor: colors.canvas, minHeight: "100vh" }}>
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
            <Stack spacing={3}>
                <Stack component="nav" aria-label="Đường dẫn đặt lịch" direction="row" useFlexGap sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                    <Button component={Link} to="/" startIcon={<ArrowBackOutlined />} sx={{ ...appointmentButtonSx, color: colors.muted, minWidth: 0 }}>Trang chủ</Button>
                    <Typography component="span" sx={{ color: colors.muted }}>/</Typography>
                    <Typography component="h1" sx={{ fontSize: 14, fontWeight: 500, color: colors.muted }}>Đặt lịch trực tuyến</Typography>
                    {booking.selectedDepartment && <><Typography component="span" sx={{ color: colors.muted }}>/</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.heading }}>{booking.selectedDepartment.name}</Typography></>}
                </Stack>
                <BookingProgress currentStep={currentStep} />
                <Box sx={{ "& > .MuiPaper-root": { p: { xs: 2, md: 2.5 }, border: "1px solid", borderColor: colors.borderSoft,
                    borderRadius: "20px", bgcolor: colors.blueSoft, "& h2": { fontSize: 16 }, "& li": { fontSize: 14, lineHeight: 1.7 } } }}>
                    <AppointmentArrivalGuide />
                </Box>
                <Box><Button component={Link} to="/my-appointments" startIcon={<CalendarMonthOutlined />} sx={appointmentButtonSx}>Xem lịch hẹn của tôi</Button></Box>
                {booking.error && <Alert severity="error">{booking.error}</Alert>}
                {booking.successAppointment && <Alert severity="success">Đã ghi nhận lịch khám lúc {booking.successAppointment.startTime?.slice(0, 5)} ngày {booking.successAppointment.appointmentDate?.slice(0, 10).split("-").reverse().join("/")}.</Alert>}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
                    <Box component="form" id="booking-form" sx={{ minWidth: 0 }}
                        onSubmit={event => { event.preventDefault(); void booking.submitBooking(); }}>
                        <Stack spacing={3}>
                            <BookingDoctorSelector booking={booking} />
                            <BookingScheduleSelector booking={booking} />
                            <BookingPatientForm booking={booking} />
                        </Stack>
                    </Box>
                    <BookingSummary booking={booking} currentStep={currentStep} />
                </Box>
            </Stack>
        </Container>
        <BookingSuccessDialog open={successDialogOpen} appointment={booking.successAppointment} onClose={() => setSuccessDialogOpen(false)} />
    </Box>;
}
