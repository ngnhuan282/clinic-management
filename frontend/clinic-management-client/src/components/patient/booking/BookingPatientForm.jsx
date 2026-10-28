import { Avatar, Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { PersonOutlineOutlined } from "@mui/icons-material";
import { bookingColors as colors, bookingFieldSx, bookingPanelSx, bookingSectionTitleSx } from "./bookingUi";

export default function BookingPatientForm({ booking }) {
    return <Paper elevation={0} sx={bookingPanelSx}>
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: colors.blueSoft, color: colors.primary }}><PersonOutlineOutlined fontSize="small" /></Avatar>
                <Box>
                    <Typography component="h2" sx={bookingSectionTitleSx}>5. Thông Tin Bệnh Nhân & Triệu Chứng Ban Đầu</Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 13, color: colors.muted }}>Nhập thông tin liên hệ và lý do khám</Typography>
                </Box>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                <TextField required fullWidth label="Họ và tên bệnh nhân" autoComplete="name" value={booking.patientName}
                    onChange={event => booking.setPatientName(event.target.value)} sx={bookingFieldSx} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField required fullWidth label="Số điện thoại liên hệ" type="tel" autoComplete="tel" value={booking.patientPhone}
                    onChange={event => booking.setPatientPhone(event.target.value)} sx={bookingFieldSx} slotProps={{ htmlInput: { maxLength: 20 } }} />
            </Box>
            <TextField required fullWidth multiline minRows={5} label="Mô tả lý do khám & triệu chứng bệnh lý" value={booking.reason}
                onChange={event => booking.setReason(event.target.value)} sx={bookingFieldSx} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </Stack>
    </Paper>;
}
