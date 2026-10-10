import { Box, Paper, Typography } from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

const cards = [
    {
        key: "readyToDispense",
        label: "Sẵn sàng cấp",
        suffix: "đơn",
        icon: HourglassEmptyOutlinedIcon,
        color: "#005DAC",
        backgroundColor: "#EFF6FF",
    },
    {
        key: "awaitingPayment",
        label: "Chờ thanh toán",
        suffix: "đơn",
        icon: PaymentsOutlinedIcon,
        color: "#D97706",
        backgroundColor: "#FFFBEB",
    },
    {
        key: "dispensedToday",
        label: "Đã cấp hôm nay",
        suffix: "đơn",
        icon: CheckCircleOutlineOutlinedIcon,
        color: "#059669",
        backgroundColor: "#ECFDF5",
    },
];

function DispensingStatCards({ summary }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
            }}
        >
            {cards.map((card) => {
                const Icon = card.icon;
                const value = Number(summary?.[card.key] || 0);

                return (
                    <Paper
                        key={card.key}
                        elevation={0}
                        sx={{
                            p: 2.25,
                            minHeight: 118,
                            borderRadius: 2,
                            border: "1px solid #E5E9F0",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#64748B",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                }}
                            >
                                {card.label}
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    mt: 1.25,
                                    color: "#111827",
                                    fontWeight: 800,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {value.toLocaleString("vi-VN")} {card.suffix}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                color: card.color,
                                backgroundColor: card.backgroundColor,
                            }}
                        >
                            <Icon />
                        </Box>
                    </Paper>
                );
            })}
        </Box>
    );
}

export default DispensingStatCards;
