// src/components/patient/StatsSection.jsx

import { Box, Container, Grid, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const FONT = "'Inter', sans-serif";

const COLORS = {
    primary: "#005dac",
    textHeading: "#1f2937",
    textMuted: "#6b7280",
    borderSubtle: "#e5e9f0",
};

const STATS = [
    {
        id: "total-visits",
        icon: ReceiptLongIcon,
        iconColor: "#005dac",
        iconBg: "#eff6ff",
        value: "150.000+",
        label: "Lượt khám thành công",
    },
    {
        id: "total-doctors",
        icon: GroupsIcon,
        iconColor: "#16a34a",
        iconBg: "#f0fdf4",
        value: "85+",
        label: "Bác sĩ BSCKII & Thạc sĩ",
    },
    {
        id: "satisfaction-rate",
        icon: SentimentSatisfiedAltIcon,
        iconColor: "#d97706",
        iconBg: "#fffbeb",
        value: "98.6%",
        label: "Mức độ hài lòng y khoa",
    },
    {
        id: "no-wait",
        icon: AccessTimeIcon,
        iconColor: "#0891b2",
        iconBg: "#ecfeff",
        value: "100%",
        label: "Khám không chờ đợi",
    },
];

const STATS_STYLES = {
    section: {
        py: 5,
        backgroundColor: "#ffffff",
        borderTop: `1px solid ${COLORS.borderSubtle}`,
    },
    card: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 3,
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: "16px",
        backgroundColor: "#ffffff",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
            boxShadow: "0 8px 24px rgba(0,93,172,0.10)",
            transform: "translateY(-2px)",
        },
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    value: {
        fontFamily: FONT,
        fontSize: { xs: "24px", md: "30px" },
        fontWeight: 800,
        color: COLORS.textHeading,
        lineHeight: 1.1,
        letterSpacing: "-0.5px",
        m: 0,
    },
    label: {
        fontFamily: FONT,
        fontSize: "13px",
        color: COLORS.textMuted,
        lineHeight: 1.4,
        mt: 0.25,
    },
};

function StatsSection() {
    return (
        <Box component="section" sx={STATS_STYLES.section}>
            <Container maxWidth="lg">
                <Grid container spacing={2}>
                    {STATS.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Grid key={stat.id} size={{ xs: 12, sm: 6, md: 3 }}>
                                <Box sx={STATS_STYLES.card}>
                                    <Box
                                        sx={{
                                            ...STATS_STYLES.iconWrapper,
                                            backgroundColor: stat.iconBg,
                                        }}
                                    >
                                        <IconComponent
                                            sx={{ fontSize: "26px", color: stat.iconColor }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography component="p" sx={STATS_STYLES.value}>
                                            {stat.value}
                                        </Typography>
                                        <Typography sx={STATS_STYLES.label}>
                                            {stat.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Container>
        </Box>
    );
}

export default StatsSection;
