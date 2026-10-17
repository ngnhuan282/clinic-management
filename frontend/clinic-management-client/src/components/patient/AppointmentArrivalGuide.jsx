import { Box, Paper, Typography } from "@mui/material";
import { clinicColors, clinicSurfaceSx } from "../common/clinicUi";

export default function AppointmentArrivalGuide() {
    return <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2, sm: 2.5 }, bgcolor: "#F0F9FF" }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, color: clinicColors.heading }}>
            Đặt lịch và chuẩn bị sổ khám
        </Typography>
        <Box component="ol" sx={{ mb: 0, mt: 1.5, pl: 2.5, color: clinicColors.heading,
            "& li": { pl: 0.5, mb: 1, fontSize: 14, lineHeight: 1.7 }, "& li:last-child": { mb: 0 } }}>
            <li>Bạn có thể đặt lịch trên web khi chưa có sổ khám. Theo dõi xác nhận tại “Lịch hẹn của tôi”.</li>
            <li>Khi đến phòng khám, mang sổ giấy hiện có và giấy tờ tùy thân để lễ tân đối chiếu, xác minh sổ và làm thủ tục check-in.</li>
            <li>Nếu chưa có, mất hoặc quên sổ, hãy báo lễ tân. Lễ tân chỉ phát hoặc cấp lại sổ sau khi hóa đơn sổ đã thanh toán (Paid), áp dụng cho cả lịch đặt web và đến trực tiếp.</li>
        </Box>
    </Paper>;
}
