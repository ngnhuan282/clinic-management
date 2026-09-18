import { Box, Paper, Stack, Typography } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";

const CARD_CONFIG = [
    {
        key: "totalCategories",
        label: "Tổng danh mục",
        accent: "#2563EB",
        icon: CategoryOutlinedIcon,
    },
    {
        key: "totalMedicines",
        label: "Tổng thuốc đã phân loại",
        accent: "#7C3AED",
        icon: Inventory2OutlinedIcon,
    },
    {
        key: "categoriesInUse",
        label: "Đang áp dụng",
        accent: "#059669",
        icon: CheckCircleOutlineOutlinedIcon,
    },
    {
        key: "emptyCategories",
        label: "Chưa có thuốc",
        accent: "#F59E0B",
        icon: PlaylistRemoveOutlinedIcon,
    },
];

function MedicineCategoryStatCards({ summary }) {
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
                const value = summary?.[item.key] ?? 0;

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

export default MedicineCategoryStatCards;
