import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { FactCheckOutlined, InfoOutlined, MenuBookOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { clinicColors, clinicSurfaceSx } from "../common/clinicUi";

const GUIDE_ITEMS = [
    {
        step: "1",
        icon: FactCheckOutlined,
        text: "Bạn có thể đặt lịch trên web ngay cả khi chưa có sổ khám. Theo dõi trạng thái xác nhận tại mục “Lịch hẹn của tôi”.",
    },
    {
        step: "2",
        icon: VerifiedUserOutlined,
        text: "Khi đến phòng khám, mang theo sổ khám giấy hiện có và giấy tờ tùy thân để lễ tân đối chiếu, xác minh sổ và làm thủ tục check-in.",
    },
    {
        step: "3",
        icon: MenuBookOutlined,
        text: "Nếu chưa có, mất hoặc quên sổ, hãy báo quầy lễ tân. Lễ tân cấp mới hoặc cấp lại sổ sau khi hóa đơn sổ đã thanh toán (Paid).",
    },
];

export default function AppointmentArrivalGuide() {
    return (
        <Paper
            variant="outlined"
            sx={{
                ...clinicSurfaceSx,
                p: { xs: 2.25, sm: 2.75 },
                borderRadius: "14px",
                borderColor: "#90BCE6",
                bgcolor: "#EAF2FA",
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                <InfoOutlined sx={{ fontSize: 21, color: clinicColors.primary }} />
                <Typography component="h2" sx={{ fontSize: 16.5, fontWeight: 800, color: clinicColors.heading }}>
                    Đặt lịch và chuẩn bị sổ khám khi đến quầy
                </Typography>
            </Stack>

            <Grid container spacing={1.75} component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {GUIDE_ITEMS.map(({ step, icon: Icon, text }) => (
                    <Grid key={step} size={{ xs: 12, md: 4 }} component="li">
                        <Box
                            sx={{
                                p: 1.75,
                                height: "100%",
                                borderRadius: "12px",
                                bgcolor: "#FFFFFF",
                                border: "1px solid #C5D8EC",
                                display: "flex",
                                gap: 1.35,
                                alignItems: "flex-start",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "8px",
                                    bgcolor: "#0B4F8A",
                                    color: "#FFFFFF",
                                    display: "grid",
                                    placeItems: "center",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    flexShrink: 0,
                                    mt: 0.15,
                                }}
                            >
                                <Icon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography sx={{ fontSize: 14, lineHeight: 1.65, color: "#1E293B" }}>
                                {text}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}
