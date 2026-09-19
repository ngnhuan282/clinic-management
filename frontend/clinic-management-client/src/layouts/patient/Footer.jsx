// src/layouts/patient/Footer.jsx

import {
    Box,
    Container,
    Grid,
    Link,
    Typography,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import VerifiedIcon from "@mui/icons-material/Verified";

const COLORS = {
    primary: "#005dac",
    primaryLight: "#eff6ff",
    primaryBorder: "#bfdbfe",
    textHeading: "#1f2937",
    textBody: "#374151",
    textMuted: "#6b7280",
    borderSubtle: "#e5e9f0",
    successLight: "#f0fdf4",
    successBorder: "#bbf7d0",
    success: "#16a34a",
};

const SERVICES_LINKS = [
    "Chính sách bảo mật y tế",
    "Quy định khám chữa bệnh",
    "Bảo hiểm liên kết y tế",
    "Hướng dẫn bệnh nhân",
    "Hệ thống cơ sở phòng khám",
];

const QUICK_LINKS = [
    "Tim mạch can thiệp",
    "Sản phụ khoa & Vô sinh",
    "Nhi khoa & Tiêm chủng",
    "Cơ xương khớp kỹ thuật cao",
    "Chẩn đoán hình ảnh MRI/CT",
];

const CLINIC_LOCATIONS = [
    {
        id: "loc-hcm",
        label: "Cơ sở 1:",
        address: "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
    },
    {
        id: "loc-hn",
        label: "Cơ sở 2:",
        address: "54 Tràng Thi, Hoàn Kiếm, Hà Nội",
    },
];

const FOOTER_STYLES = {
    footer: {
        backgroundColor: "#f8fafc",
        borderTop: `1px solid ${COLORS.borderSubtle}`,
        pt: 6,
        pb: 0,
        mt: "auto",
    },
    logoRow: {
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        mb: 1.5,
    },
    logoIconBox: {
        width: 38,
        height: 38,
        backgroundColor: COLORS.primary,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
    },
    colTitle: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
        fontWeight: 700,
        color: COLORS.textHeading,
        mb: 2,
    },
    linkItem: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        color: COLORS.textBody,
        textDecoration: "none",
        display: "block",
        mb: 1.25,
        lineHeight: 1.5,
        "&:hover": {
            color: COLORS.primary,
            textDecoration: "underline",
        },
    },
    hotlineBox: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        mt: 2,
        p: 1.5,
        backgroundColor: COLORS.primaryLight,
        borderRadius: "10px",
        border: `1px solid ${COLORS.primaryBorder}`,
    },
    certBadge: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        mt: 1.5,
        p: 1.5,
        backgroundColor: COLORS.successLight,
        borderRadius: "10px",
        border: `1px solid ${COLORS.successBorder}`,
    },
    bottomBar: {
        mt: 4,
        py: 2.5,
        borderTop: `1px solid ${COLORS.borderSubtle}`,
    },
    copyrightText: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        color: COLORS.textMuted,
        lineHeight: 1.6,
    },
};

function Footer() {
    return (
        <Box component="footer" sx={FOOTER_STYLES.footer}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={FOOTER_STYLES.logoRow}>
                            <Box sx={FOOTER_STYLES.logoIconBox}>
                                <LocalHospitalIcon sx={{ fontSize: "20px" }} />
                            </Box>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "15px",
                                    fontWeight: 800,
                                    color: COLORS.primary,
                                    lineHeight: 1.2,
                                }}
                            >
                                Clinic Management System
                            </Typography>
                        </Box>

                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "13px",
                                color: COLORS.textMuted,
                                lineHeight: 1.75,
                            }}
                        >
                            Hệ thống phòng khám đa khoa kỹ thuật cao chuẩn quốc tế. Cung cấp
                            giải pháp chăm sóc y tế toàn diện, chẩn đoán chính xác và ứng dụng
                            bệnh án điện tử hiện đại.
                        </Typography>

                        <Box sx={FOOTER_STYLES.hotlineBox}>
                            <LocalPhoneIcon sx={{ fontSize: "20px", color: COLORS.primary }} />
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: "11px",
                                        color: COLORS.textMuted,
                                    }}
                                >
                                    Hotline Cấp Cứu 24/7:
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: "16px",
                                        fontWeight: 700,
                                        color: COLORS.primary,
                                    }}
                                >
                                    1900 6868
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography sx={FOOTER_STYLES.colTitle}>
                            Dịch Vụ & Quy Định
                        </Typography>
                        {SERVICES_LINKS.map((item) => (
                            <Link key={item} href="#" underline="none" sx={FOOTER_STYLES.linkItem}>
                                {item}
                            </Link>
                        ))}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography sx={FOOTER_STYLES.colTitle}>
                            Liên kết nhanh
                        </Typography>
                        {QUICK_LINKS.map((item) => (
                            <Link key={item} href="#" underline="none" sx={FOOTER_STYLES.linkItem}>
                                {item}
                            </Link>
                        ))}
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography sx={FOOTER_STYLES.colTitle}>
                            Cơ Sở Hoạt Động
                        </Typography>
                        {CLINIC_LOCATIONS.map((loc) => (
                            <Box key={loc.id} sx={{ mb: 1.5 }}>
                                <Typography
                                    sx={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: "13px",
                                        color: COLORS.textBody,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{ fontWeight: 700, color: COLORS.textHeading }}
                                    >
                                        {loc.label}
                                    </Box>{" "}
                                    {loc.address}
                                </Typography>
                            </Box>
                        ))}

                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "13px",
                                color: COLORS.textBody,
                                mb: 0.5,
                            }}
                        >
                            <Box component="span" sx={{ fontWeight: 700, color: COLORS.textHeading }}>
                                Email:
                            </Box>{" "}
                            contact@medclinic-system.vn
                        </Typography>

                        <Box sx={FOOTER_STYLES.certBadge}>
                            <VerifiedIcon sx={{ fontSize: "18px", color: COLORS.success }} />
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: COLORS.success,
                                }}
                            >
                                Chứng nhận Bộ Y Tế & JCI
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={FOOTER_STYLES.bottomBar}>
                    <Typography sx={FOOTER_STYLES.copyrightText}>
                        © 2024 Phòng Khám Đa Khoa Hiện Đại. Giấy phép hoạt động số:
                        01234/SYT-GPHĐ cấp bởi Sở Y tế. Giờ làm việc: 07:30 – 20:00 (Thứ 2 –
                        Chủ Nhật). Hotline Cấp Cứu 24/7: 1900 6868.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}

export default Footer;
