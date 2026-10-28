import { Avatar, Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import { AccessTimeOutlined, ArrowForwardOutlined, AssignmentTurnedInOutlined, CalendarMonthOutlined, EventAvailableOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { bookingColors as colors, bookingPanelSx, bookingPrimaryButtonSx, bookingSecondaryButtonSx, bookingSectionTitleSx } from "./bookingUi";

function SummaryRow({ label, value, icon }) {
    return <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 1.5, alignItems: "start" }}>
        <Stack component="dt" direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            {icon && <Box component="span" sx={{ display: "flex", color: colors.primary, flexShrink: 0 }}>{icon}</Box>}
            <Typography component="span" sx={{ fontSize: 13, color: colors.muted }}>{label}</Typography>
        </Stack>
        <Typography component="dd" sx={{ m: 0, fontSize: 13, color: colors.heading, fontWeight: 700, textAlign: "right", overflowWrap: "anywhere" }}>{value || "Chưa chọn"}</Typography>
    </Box>;
}

export default function BookingSummary({ booking, currentStep }) {
    const ready = currentStep === 6 && !booking.loading.slots && !booking.loading.submitting;
    const doctor = booking.selectedDoctor;
    const date = booking.selectedDate ? booking.selectedDate.split("-").reverse().join("/") : "";
    return <Paper component="aside" aria-labelledby="booking-summary-title" elevation={0} sx={{ ...bookingPanelSx, position: { lg: "sticky" }, top: { lg: 94 } }}>
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                    <AssignmentTurnedInOutlined sx={{ color: colors.primary, fontSize: 22, flexShrink: 0 }} />
                    <Typography component="h2" id="booking-summary-title" sx={bookingSectionTitleSx}>Phiếu Tóm Tắt Đặt Khám</Typography>
                </Stack>
                <Chip label={`Bước ${currentStep}/6`} size="small" sx={{ bgcolor: colors.blueSoft, color: colors.primaryDark, fontWeight: 800 }} />
            </Stack>
            <Divider sx={{ borderColor: colors.border }} />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: colors.blueSoft, color: colors.primaryDark, fontWeight: 800 }}>{doctor?.fullName?.slice(0, 1) || "BS"}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        {doctor?.title && <Chip label={doctor.title} size="small" sx={{ height: 22, bgcolor: colors.primary, color: colors.onPrimary, fontWeight: 800 }} />}
                        {doctor?.experienceYears != null && <Typography sx={{ color: colors.muted, fontSize: 12 }}>{doctor.experienceYears} năm kinh nghiệm</Typography>}
                    </Stack>
                    <Typography sx={{ mt: 0.5, color: colors.heading, fontWeight: 800, overflowWrap: "anywhere" }}>{doctor?.fullName || "Chưa chọn bác sĩ"}</Typography>
                    <Typography sx={{ mt: 0.25, color: colors.primary, fontSize: 13, fontWeight: 600 }}>{booking.selectedDepartment?.name || "Chưa chọn chuyên khoa"}</Typography>
                </Box>
            </Stack>
            <Stack component="dl" spacing={1.5} sx={{ m: 0, p: 2, bgcolor: colors.canvas, border: "1px solid", borderColor: colors.border, borderRadius: 2 }}>
                <SummaryRow label="Ngày khám" value={date} icon={<EventAvailableOutlined fontSize="small" />} />
                <SummaryRow label="Khung giờ hẹn" value={booking.selectedSlot ? `${booking.selectedSlot.startTime.slice(0, 5)} đến ${booking.selectedSlot.endTime.slice(0, 5)}` : ""} icon={<AccessTimeOutlined fontSize="small" />} />
            </Stack>
            <Stack component="dl" spacing={1.5} sx={{ m: 0 }}>
                <SummaryRow label="Người khám" value={booking.patientName.trim()} />
                <SummaryRow label="Liên hệ" value={booking.patientPhone.trim()} />
            </Stack>
            <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: colors.border }}>
                <Button type="submit" form="booking-form" fullWidth variant="contained" disabled={!ready} sx={{ ...bookingPrimaryButtonSx, py: 1.4, fontWeight: 800 }}
                    endIcon={booking.loading.submitting ? <CircularProgress size={17} color="inherit" /> : <ArrowForwardOutlined />}>
                    {booking.loading.submitting ? "Đang đặt lịch..." : "Xác Nhận Đặt Lịch Khám"}
                </Button>
                {!ready && !booking.loading.submitting && <Typography sx={{ mt: 1, fontSize: 12, color: colors.muted }}>Hoàn tất các bước và thông tin bắt buộc để xác nhận.</Typography>}
            </Box>
            <Button component={Link} to="/my-appointments" variant="outlined" startIcon={<CalendarMonthOutlined />} sx={bookingSecondaryButtonSx}>Xem lịch hẹn của tôi</Button>
        </Stack>
    </Paper>;
}
