import {
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";

const STAT_META = {
    total: {
        label: "Lịch khám hôm nay",
        color: "#2563EB",
        backgroundColor: "#EFF6FF",
        icon: CalendarMonthOutlinedIcon,
    },
    waiting: {
        label: "Đang chờ khám",
        color: "#D97706",
        backgroundColor: "#FFFBEB",
        icon: HourglassTopOutlinedIcon,
    },
    inProgress: {
        label: "Đang khám",
        color: "#005DAC",
        backgroundColor: "#EFF6FF",
        icon: MedicalServicesOutlinedIcon,
    },
    completed: {
        label: "Đã hoàn tất",
        color: "#059669",
        backgroundColor: "#ECFDF5",
        icon: CheckCircleOutlineOutlinedIcon,
    },
};

function DoctorQueueStatCards({ stats }) {
    const items = [
        {
            key: "total",
            value: stats.total,
        },
        {
            key: "waiting",
            value: stats.waiting,
        },
        {
            key: "inProgress",
            value: stats.inProgress,
        },
        {
            key: "completed",
            value: stats.completed,
        },
    ];

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
            }}
        >
            {items.map((item) => {
                const meta = STAT_META[item.key];
                const Icon = meta.icon;

                return (
                    <Paper
                        key={item.key}
                        elevation={0}
                        sx={{
                            position: "relative",
                            p: 2.25,
                            pr: 8,
                            minHeight: 126,
                            border: "1px solid #E5E9F0",
                            borderRadius: 2,
                            backgroundColor: "#FFFFFF",
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            gap={2}
                            sx={{ width: "100%" }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#6B7280",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {meta.label}
                                </Typography>

                                <Typography
                                    variant="h4"
                                    sx={{
                                        mt: 1.25,
                                        color: meta.color,
                                        fontWeight: 900,
                                        fontVariantNumeric:
                                            "tabular-nums",
                                    }}
                                >
                                    {String(item.value).padStart(2, "0")}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 18,
                                    right: 18,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 1.5,
                                    display: "grid",
                                    placeItems: "center",
                                    color: meta.color,
                                    backgroundColor: meta.backgroundColor,
                                    flexShrink: 0,
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

export default DoctorQueueStatCards;
