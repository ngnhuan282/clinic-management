import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { appointmentColors as colors, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx, appointmentSurfaceSx } from "../../appointments/appointmentUi";

function SummaryRow({ label, value }) {
    return <Box sx={{ display: "grid", gridTemplateColumns: "100px minmax(0, 1fr)", gap: 1.5 }}>
        <Typography component="dt" sx={{ fontSize: 13, color: colors.muted }}>{label}</Typography>
        <Typography component="dd" sx={{ m: 0, fontSize: 14, color: colors.heading, fontWeight: 500, overflowWrap: "anywhere" }}>{value || "Chưa chọn"}</Typography>
    </Box>;
}

export default function BookingSummary({ booking, currentStep }) {
    const ready = currentStep === 6 && !booking.loading.slots && !booking.loading.submitting;
    const date = booking.selectedDate ? booking.selectedDate.split("-").reverse().join("/") : "";
    return <Paper component="aside" aria-labelledby="booking-summary-title" elevation={0} sx={{ ...appointmentSurfaceSx, p: { xs: 2, sm: 2.5 }, position: { lg: "sticky" }, top: { lg: 96 } }}>
        <Stack spacing={2.5}>
            <Box>
                <Typography component="h2" id="booking-summary-title" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>6. Xác nhận đặt khám</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: colors.muted }}>Kiểm tra thông tin trước khi gửi lịch hẹn.</Typography>
            </Box>
            <Stack component="dl" spacing={1.5} sx={{ m: 0 }}>
                <SummaryRow label="Chuyên khoa" value={booking.selectedDepartment?.name} />
                <SummaryRow label="Bác sĩ" value={booking.selectedDoctor?.fullName} />
                <SummaryRow label="Ngày khám" value={date} />
                <SummaryRow label="Khung giờ" value={booking.selectedSlot ? `${booking.selectedSlot.startTime.slice(0, 5)} đến ${booking.selectedSlot.endTime.slice(0, 5)}` : ""} />
                <SummaryRow label="Người khám" value={booking.patientName.trim()} />
                <SummaryRow label="Liên hệ" value={booking.patientPhone.trim()} />
            </Stack>
            <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: colors.borderSoft }}>
                <Button type="submit" form="booking-form" fullWidth variant="contained" disabled={!ready} sx={appointmentPrimaryButtonSx}
                    startIcon={booking.loading.submitting ? <CircularProgress size={17} color="inherit" /> : <CalendarMonthOutlined />}>
                    {booking.loading.submitting ? "Đang đặt lịch..." : "Xác Nhận Đặt Lịch Khám"}
                </Button>
                {!ready && !booking.loading.submitting && <Typography sx={{ mt: 1, fontSize: 12, color: colors.muted }}>Hoàn tất các bước và thông tin bắt buộc để xác nhận.</Typography>}
            </Box>
            <Button component={Link} to="/my-appointments" variant="outlined" sx={appointmentSecondaryButtonSx}>Xem lịch hẹn của tôi</Button>
        </Stack>
    </Paper>;
}
