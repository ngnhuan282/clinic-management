import { Box, Paper, Typography } from "@mui/material";
import { appointmentColors as colors } from "../appointments/appointmentUi";

export default function AppointmentArrivalGuide() {
    return <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: colors.primarySoft, borderRadius: 2 }}>
        <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600, color: colors.heading }}>
            Đặt lịch và chuẩn bị sổ khám
        </Typography>
        <Box component="ol" sx={{ mb: 0, mt: 1, pl: 2.5, color: colors.body,
            "& li": { pl: 0.5, mb: 0.75, fontSize: 13, lineHeight: 1.6 }, "& li:last-child": { mb: 0 } }}>
            <li>Bạn có thể đặt lịch trên web khi chưa có sổ khám. Theo dõi xác nhận tại “Lịch hẹn của tôi”.</li>
            <li>Khi đến phòng khám, mang sổ giấy hiện có và giấy tờ tùy thân để lễ tân đối chiếu, xác minh sổ và làm thủ tục check-in.</li>
            <li>Nếu chưa có, mất hoặc quên sổ, hãy báo lễ tân. Lễ tân chỉ phát hoặc cấp lại sổ sau khi hóa đơn sổ đã thanh toán (Paid), áp dụng cho cả lịch đặt web và đến trực tiếp.</li>
        </Box>
    </Paper>;
}
