import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import StatusBadge from "../../common/StatusBadge";
import { appointmentColors as colors, appointmentDialogActionsSx, appointmentDialogPaperSx, appointmentDialogTitleSx, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx } from "../../appointments/appointmentUi";

export default function BookingSuccessDialog({ open, appointment, onClose }) {
    const rows = [
        ["Mã lịch hẹn", appointment?.appointmentId ? `#${appointment.appointmentId}` : ""],
        ["Bác sĩ", appointment?.doctorName], ["Chuyên khoa", appointment?.departmentName],
        ["Ngày khám", appointment?.appointmentDate?.slice(0, 10).split("-").reverse().join("/")],
        ["Giờ khám", appointment?.startTime?.slice(0, 5)],
    ];
    return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="booking-success-title"
        slotProps={{ paper: { className: "appointment-dialog", sx: appointmentDialogPaperSx } }}>
        <DialogTitle id="booking-success-title" sx={appointmentDialogTitleSx}>Đặt lịch khám thành công</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ mt: 2, mb: 2.5, fontSize: 14, color: colors.muted }}>Lịch hẹn của bạn đã được ghi nhận trên hệ thống.</Typography>
            <Stack component="dl" spacing={1.5} sx={{ m: 0 }}>
                {rows.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: "100px minmax(0, 1fr)", gap: 2 }}>
                    <Typography component="dt" sx={{ fontSize: 14, color: colors.muted }}>{label}</Typography>
                    <Typography component="dd" sx={{ m: 0, fontSize: 14, color: colors.heading }}>{value || "Đang cập nhật"}</Typography>
                </Box>)}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}><Typography component="dt" sx={{ fontSize: 14, color: colors.muted }}>Trạng thái</Typography>
                    <Box component="dd" sx={{ m: 0 }}><StatusBadge status={appointment?.status || "Pending"} /></Box></Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={appointmentDialogActionsSx}>
            <Button component={Link} to="/my-appointments" variant="outlined" onClick={onClose} sx={appointmentSecondaryButtonSx}>Lịch hẹn của tôi</Button>
            <Button variant="contained" onClick={onClose} sx={appointmentPrimaryButtonSx}>Đã hiểu</Button>
        </DialogActions>
    </Dialog>;
}
