import { Box, Stack, TextField, Typography } from "@mui/material";
import { appointmentColors as colors, appointmentFieldSx } from "../../appointments/appointmentUi";

export default function BookingPatientForm({ booking }) {
    return <Stack spacing={2}>
        <Box>
            <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>5. Thông tin bệnh nhân và lý do khám</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 14, color: colors.muted }}>Nhập thông tin liên hệ để lễ tân xác nhận lịch hẹn.</Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField required fullWidth size="small" label="Họ và tên bệnh nhân" autoComplete="name" value={booking.patientName}
                onChange={event => booking.setPatientName(event.target.value)} sx={appointmentFieldSx} slotProps={{ htmlInput: { maxLength: 100 } }} />
            <TextField required fullWidth size="small" label="Số điện thoại liên hệ" type="tel" autoComplete="tel" value={booking.patientPhone}
                onChange={event => booking.setPatientPhone(event.target.value)} sx={appointmentFieldSx} slotProps={{ htmlInput: { maxLength: 20 } }} />
        </Box>
        <TextField required fullWidth multiline minRows={3} label="Mô tả lý do khám & triệu chứng bệnh lý" value={booking.reason}
            onChange={event => booking.setReason(event.target.value)} sx={appointmentFieldSx} slotProps={{ htmlInput: { maxLength: 500 } }} />
    </Stack>;
}
