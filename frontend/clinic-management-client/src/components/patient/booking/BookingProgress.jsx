import { Box, Typography } from "@mui/material";
import { CheckOutlined } from "@mui/icons-material";
import { appointmentColors as colors } from "../../appointments/appointmentUi";

const steps = ["Chuyên khoa", "Bác sĩ", "Ngày khám", "Khung giờ", "Lý do khám", "Xác nhận"];

export default function BookingProgress({ currentStep }) {
    return <Box component="ol" aria-label="Tiến trình đặt lịch" sx={{ m: 0, p: 0, listStyle: "none",
        display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1.5 }}>
        {steps.map((label, index) => {
            const active = index + 1 === currentStep;
            const complete = index + 1 < currentStep;
            return <Box component="li" key={label} aria-current={active ? "step" : undefined}
                sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Box sx={{ width: 28, height: 28, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%",
                    bgcolor: active ? colors.primary : colors.primarySoft,
                    color: active ? colors.onPrimary : colors.primary, fontSize: 13, fontWeight: 600 }}>
                    {complete ? <CheckOutlined sx={{ fontSize: 17 }} /> : index + 1}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? colors.heading : colors.muted }}>{label}</Typography>
            </Box>;
        })}
    </Box>;
}
