// src/components/patient/HeroSection.jsx

import {
    Box,
    Button,
    Chip,
    Container,
    Stack,
    Typography,
} from "@mui/material";

const COLORS = {
    primary: "#005dac",
    primaryDark: "#004a8f",
    primaryLight: "#eff6ff",
    primaryBorder: "#bfdbfe",
    textHeading: "#1f2937",
    textBody: "#374151",
    textMuted: "#6b7280",
};
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

const FEATURED_DOCTOR = {
    initials: "BS",
    label: "Trực Cấp Cứu & Khám Trong Ngày",
    name: "PGS.TS.BS Trần Minh Tuấn",
    specialty: "Chuyên khoa Tim Mạch & Huyết Áp",
    available: "Có lịch hôm nay",
};

const FONT = "'Inter', sans-serif";

const HERO_STYLES = {
    section: {
        py: { xs: 6, md: 8 },
        backgroundColor: "#ffffff",
    },
    container: {
        display: "flex",
        alignItems: "center",
        gap: { xs: 4, lg: 8 },
        flexDirection: { xs: "column", md: "row" },
    },
    leftCol: {
        flex: "1 1 45%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
    },
    badge: {
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
        border: `1px solid ${COLORS.primaryBorder}`,
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: 500,
        height: "32px",
        alignSelf: "flex-start",
        "& .MuiChip-icon": { color: COLORS.primary },
    },
    headline: {
        fontFamily: FONT,
        fontSize: { xs: "32px", md: "38px", lg: "44px" },
        fontWeight: 800,
        color: COLORS.textHeading,
        lineHeight: 1.15,
        letterSpacing: "-0.5px",
        m: 0,
    },
    description: {
        fontFamily: FONT,
        fontSize: "15px",
        lineHeight: 1.75,
        color: COLORS.textBody,
    },
    primaryBtn: {
        textTransform: "none",
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: "15px",
        backgroundColor: COLORS.primary,
        borderRadius: "10px",
        px: 3,
        py: 1.4,
        gap: 1,
        whiteSpace: "nowrap",
        boxShadow: "none",
        "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "none" },
    },
    secondaryBtn: {
        textTransform: "none",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: "15px",
        color: COLORS.primary,
        border: `1.5px solid ${COLORS.primaryBorder}`,
        borderRadius: "10px",
        px: 3,
        py: 1.4,
        gap: 1,
        whiteSpace: "nowrap",
        backgroundColor: COLORS.primaryLight,
        "&:hover": { backgroundColor: "#dbeafe", borderColor: COLORS.primary },
    },
    rightCol: {
        flex: "1 1 50%",
        position: "relative",
    },
    imageWrapper: {
        borderRadius: "20px",
        overflow: "hidden",
        width: "100%",
        aspectRatio: "4/3",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,93,172,0.15)",
    },
    doctorImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    roomBadge: {
        position: "absolute",
        top: 16,
        left: 16,
        backgroundColor: "#fff",
        borderRadius: "12px",
        px: 2,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    },
    doctorCard: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderRadius: "0 0 20px 20px",
        px: 2.5,
        py: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
    },
    doctorAvatar: {
        width: 44,
        height: 44,
        borderRadius: "12px",
        backgroundColor: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: "14px",
        flexShrink: 0,
    },
};

function HeroSection() {
    return (
        <Box component="section" sx={HERO_STYLES.section}>
            <Container maxWidth="lg" sx={HERO_STYLES.container}>
                {/* Left column */}
                <Box sx={HERO_STYLES.leftCol}>
                    {/* Badge */}
                    <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: "10px !important" }} />}
                        label="Chuẩn Mực Khám Bệnh Không Chờ Đợi 4.0"
                        sx={HERO_STYLES.badge}
                    />

                    {/* Headline */}
                    <Typography component="h1" sx={HERO_STYLES.headline}>
                        Chăm sóc sức khỏe toàn diện với tiêu chuẩn y khoa quốc tế
                    </Typography>

                    {/* Description */}
                    <Typography sx={HERO_STYLES.description}>
                        Hệ thống phòng khám đa khoa kỹ thuật cao, quy tụ hơn{" "}
                        <strong>85+ Giáo sư, Bác sĩ Chuyên khoa II</strong> đầu ngành từ Bệnh
                        viện Bạch Mai, Chợ Rẫy, Việt Đức. Chẩn đoán chính xác, điều trị cá
                        thể hóa với trang thiết bị y tế nhập khẩu từ Đức và Hoa Kỳ.
                    </Typography>

                    {/* CTA Buttons */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button
                            variant="contained"
                            component="a"
                            href="/booking"
                            sx={HERO_STYLES.primaryBtn}
                        >
                            <CalendarMonthIcon sx={{ fontSize: "20px" }} />
                            Đặt lịch khám trực tuyến
                        </Button>
                        <Button
                            variant="outlined"
                            component="a"
                            href="/doctors"
                            sx={HERO_STYLES.secondaryBtn}
                        >
                            <SearchIcon sx={{ fontSize: "20px" }} />
                            Tra cứu bác sĩ &amp; chuyên khoa
                        </Button>
                    </Stack>
                </Box>

                {/* Right column — Doctor image */}
                <Box sx={HERO_STYLES.rightCol}>
                    <Box sx={HERO_STYLES.imageWrapper}>
                        {/* Placeholder doctor image */}
                        <Box
                            sx={{
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 40%, #93c5fd 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <LocalHospitalIcon
                                sx={{ fontSize: "120px", color: "#1565C0", opacity: 0.2 }}
                            />
                        </Box>

                        {/* Room count badge */}
                        <Box sx={HERO_STYLES.roomBadge}>
                            <FiberManualRecordIcon
                                sx={{ fontSize: "10px", color: "#22C55E" }}
                            />
                            <Typography sx={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: COLORS.textHeading }}>
                                14 Phòng khám đang phục vụ
                            </Typography>
                        </Box>

                        {/* Featured doctor card */}
                        <Box sx={HERO_STYLES.doctorCard}>
                            <Box sx={HERO_STYLES.doctorAvatar}>
                                {FEATURED_DOCTOR.initials}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{ fontFamily: FONT, fontSize: "11px", color: COLORS.primary, fontWeight: 500 }}
                                >
                                    {FEATURED_DOCTOR.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: COLORS.textHeading,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {FEATURED_DOCTOR.name}
                                </Typography>
                                <Typography sx={{ fontFamily: FONT, fontSize: "12px", color: COLORS.textMuted }}>
                                    {FEATURED_DOCTOR.specialty}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    backgroundColor: "#dcfce7",
                                    color: "#16a34a",
                                    borderRadius: "8px",
                                    px: 1.5,
                                    py: 0.5,
                                    fontFamily: FONT,
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {FEATURED_DOCTOR.available}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default HeroSection;
