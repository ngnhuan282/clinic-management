import {
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const CARD_CONFIG = [
    {
        key: "totalBatches",
        label: "Tổng lô đang lưu",
        accent: "#2563EB",
        icon: Inventory2OutlinedIcon,
    },
    {
        key: "totalQuantity",
        label: "Tổng tồn khả dụng",
        accent: "#059669",
        icon: VerifiedOutlinedIcon,
    },
    {
        key: "lowStockBatches",
        label: "Tồn thấp",
        accent: "#F59E0B",
        icon: WarningAmberOutlinedIcon,
    },
    {
        key: "expiryAlerts",
        label: "Cảnh báo hạn dùng",
        accent: "#7C3AED",
        icon: HourglassBottomOutlinedIcon,
        getValue: (summary) =>
            (summary?.expiringSoonBatches ?? 0) +
            (summary?.expiredBatches ?? 0),
    },
];

function InventoryStatCards({ summary }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                width: "100%",
            }}
        >
            {CARD_CONFIG.map((item) => {
                const Icon = item.icon;
                const value = item.getValue
                    ? item.getValue(summary)
                    : summary?.[item.key] ?? 0;

                return (
                    <Paper
                        elevation={0}
                        key={item.key}
                        sx={{
                            p: 2.25,
                            minHeight: 112,
                            height: "100%",
                            borderRadius: 2,
                            border: "1px solid #E5E9F0",
                            backgroundColor: "#FFFFFF",
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            gap={2}
                            sx={{ height: "100%" }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#6B7280",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.02em",
                                        display: "block",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {item.label}
                                </Typography>

                                <Typography
                                    variant="h4"
                                    sx={{
                                        mt: 1.25,
                                        color: "#1F2937",
                                        fontWeight: 800,
                                        fontVariantNumeric:
                                            "tabular-nums",
                                    }}
                                >
                                    {value}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    flexShrink: 0,
                                    borderRadius: 2,
                                    display: "grid",
                                    placeItems: "center",
                                    color: item.accent,
                                    backgroundColor: `${item.accent}14`,
                                    ml: "auto",
                                }}
                            >
                                <Icon />
                            </Box>
                        </Stack>
                    </Paper>
                );
            })}
        </Box>
    );
}

export default InventoryStatCards;
