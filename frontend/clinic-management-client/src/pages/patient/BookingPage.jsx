import { useEffect, useState } from "react";
import { Alert, Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import useBooking from "../../hooks/useBooking";
import AppointmentArrivalGuide from "../../components/patient/AppointmentArrivalGuide";
import BookingProgress from "../../components/patient/booking/BookingProgress";
import BookingDoctorSelector from "../../components/patient/booking/BookingDoctorSelector";
import BookingScheduleSelector from "../../components/patient/booking/BookingScheduleSelector";
import BookingPatientForm from "../../components/patient/booking/BookingPatientForm";
import BookingSummary from "../../components/patient/booking/BookingSummary";
import BookingSuccessDialog from "../../components/patient/booking/BookingSuccessDialog";
import { appointmentButtonSx, appointmentColors as colors, appointmentHeadingSx, appointmentPageSx, appointmentSurfaceSx } from "../../components/appointments/appointmentUi";

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

    return <Box className="appointment-workspace" sx={{ bgcolor: colors.canvas }}>
        <Box sx={appointmentPageSx}>
            <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                    <Box>
                        <Typography component="h1" sx={appointmentHeadingSx}>Đặt lịch khám</Typography>
                        <Typography sx={{ mt: 0.75, fontSize: 14, color: colors.muted }}>Chọn bác sĩ, giờ khám và gửi thông tin để lễ tân xác nhận.</Typography>
                    </Box>
                    <Button component={Link} to="/my-appointments" startIcon={<CalendarMonthOutlined />} sx={appointmentButtonSx}>Lịch hẹn của tôi</Button>
                </Stack>
                <BookingProgress currentStep={currentStep} />
                {booking.error && <Alert severity="error">{booking.error}</Alert>}
                {booking.successAppointment && <Alert severity="success">Đã ghi nhận lịch khám lúc {booking.successAppointment.startTime?.slice(0, 5)} ngày {booking.successAppointment.appointmentDate?.slice(0, 10).split("-").reverse().join("/")}.</Alert>}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" }, gap: 3, alignItems: "start" }}>
                    <Paper component="form" id="booking-form" elevation={0} sx={{ ...appointmentSurfaceSx, p: { xs: 2, sm: 3 } }}
                        onSubmit={event => { event.preventDefault(); void booking.submitBooking(); }}>
                        <Stack spacing={3} divider={<Divider sx={{ borderColor: colors.borderSoft }} />}>
                            <BookingDoctorSelector booking={booking} />
                            <BookingScheduleSelector booking={booking} />
                            <BookingPatientForm booking={booking} />
                        </Stack>
                    </Paper>
                    <BookingSummary booking={booking} currentStep={currentStep} />
                </Box>
                <AppointmentArrivalGuide />
            </Stack>
        </Box>
        <BookingSuccessDialog open={successDialogOpen} appointment={booking.successAppointment} onClose={() => setSuccessDialogOpen(false)} />
    </Box>;
}
