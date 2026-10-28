import { Box, Paper, Typography } from "@mui/material";
import { CheckOutlined } from "@mui/icons-material";
import { bookingColors as colors, bookingPanelSx } from "./bookingUi";

const steps = ["Chọn Chuyên khoa", "Chọn Bác sĩ", "Chọn Ngày khám", "Chọn Khung giờ", "Lý Do Khám", "Xác Nhận"];

export default function BookingProgress({ currentStep }) {
    return <Paper elevation={0} sx={bookingPanelSx}>
        <Box component="ol" aria-label="Tiến trình đặt lịch" sx={{ m: 0, p: 0, listStyle: "none",
            display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1.5, alignItems: "stretch" }}>
        {steps.map((label, index) => {
            const active = index + 1 === currentStep;
            const complete = index + 1 < currentStep;
            return <Box component="li" key={label} aria-current={active ? "step" : undefined}
                sx={{ display: "grid", gridTemplateRows: "38px 18px 36px", justifyItems: "center", alignItems: "start", gap: 0.75, minWidth: 0, textAlign: "center" }}>
                <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "50%",
                    bgcolor: complete ? "var(--booking-step-done)" : active ? colors.primary : "var(--booking-step-idle)",
                    color: active || complete ? colors.onPrimary : colors.muted, fontSize: 18, fontWeight: 800,
                    boxShadow: active ? "0 0 0 4px var(--booking-step-ring)" : "none" }}>
                    {complete ? <CheckOutlined sx={{ fontSize: 17 }} /> : index + 1}
                </Box>
                <Typography sx={{ fontSize: 11, lineHeight: "18px", fontWeight: 700,
                    color: active ? colors.primaryDark : colors.muted }}>Bước {index + 1}</Typography>
                <Typography sx={{ fontSize: 12, lineHeight: "18px", fontWeight: 800, maxWidth: "100%", overflowWrap: "break-word",
                    color: active ? colors.primaryDark : colors.heading }}>{label}</Typography>
            </Box>;
        })}
        </Box>
    </Paper>;
}
