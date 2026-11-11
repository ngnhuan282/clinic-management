import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";
import { AccessTimeOutlined, EmailOutlined, LocalHospital, LocationOnOutlined, PhoneInTalkOutlined } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { CLINIC } from "../../data/publicContent";

const groups = [
    {
        title: "Khám & chăm sóc",
        links: [
            ["Chuyên khoa", "/specialties"],
            ["Đội ngũ bác sĩ", "/doctors"],
            ["Dịch vụ y tế", "/services"],
            ["Bảng giá dịch vụ", "/pricing"],
            ["Đăng ký khám", "/booking"],
        ],
    },
    {
        title: "Thông tin hữu ích",
        links: [
            ["Về phòng khám", "/about"],
            ["Hướng dẫn bệnh nhân", "/health-guide"],
            ["Đánh giá của bệnh nhân", "/reviews"],
            ["Thông tin cá nhân & bảo mật", "/privacy"],
            ["Liên hệ & cơ sở", "/contact"],
        ],
    },
];

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: "auto",
                pt: { xs: 6, md: 8 },
                pb: 3,
                bgcolor: "#f8fafc",
                borderTop: "1px solid #e5e9f0",
                color: "text.primary",
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={{ xs: 4, md: 5 }}>
                    {/* Brand Info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={2.5}>
                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "primary.main",
                                        color: "white",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <LocalHospital sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: 16.5, lineHeight: 1.2, color: "#0f2c4d" }}>
                                        {CLINIC.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>
                                        Hệ thống quản lý phòng khám đa khoa
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85, maxWidth: 360 }}>
                                Kết nối người bệnh với các chuyên khoa, bác sĩ uy tín và dịch vụ y tế chuẩn mực. Lựa chọn giờ khám và nhận hỗ trợ nhanh chóng.
                            </Typography>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    bgcolor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "50%",
                                        bgcolor: "#eff6ff",
                                        color: "primary.main",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <PhoneInTalkOutlined fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600 }}>
                                        Tổng đài tư vấn & đặt lịch
                                    </Typography>
                                    <Link
                                        href={CLINIC.phoneHref}
                                        underline="hover"
                                        sx={{
                                            fontSize: 18,
                                            fontWeight: 800,
                                            color: "primary.main",
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {CLINIC.phone}
                                    </Link>
                                </Box>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Navigation Columns */}
                    {groups.map(({ title, links }) => (
                        <Grid key={title} size={{ xs: 6, md: 2.5 }}>
                            <Typography sx={{ fontWeight: 750, fontSize: 15, mb: 2.2, color: "#1f2937" }}>
                                {title}
                            </Typography>
                            <Stack spacing={1.5}>
                                {links.map(([label, path]) => (
                                    <Link
                                        key={path}
                                        component={RouterLink}
                                        to={path}
                                        underline="none"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: 14,
                                            transition: "color 0.15s ease",
                                            "&:hover": { color: "primary.main", transform: "translateX(2px)" },
                                        }}
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </Stack>
                        </Grid>
                    ))}

                    {/* Locations & Hours */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography sx={{ fontWeight: 750, fontSize: 15, mb: 2.2, color: "#1f2937" }}>
                            Cơ sở & giờ làm việc
                        </Typography>
                        <Stack spacing={2}>
                            {CLINIC.locations.map(location => (
                                <Box key={location.name} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                    <LocationOnOutlined sx={{ fontSize: 18, color: "primary.main", mt: 0.3, flexShrink: 0 }} />
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 650, color: "#1f2937" }}>
                                            {location.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.6 }}>
                                            {location.address}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}

                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                <AccessTimeOutlined sx={{ fontSize: 18, color: "primary.main", mt: 0.3, flexShrink: 0 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 650, color: "#1f2937" }}>
                                        Giờ tiếp nhận
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                        {CLINIC.hours}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                                <EmailOutlined sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                <Link
                                    href={`mailto:${CLINIC.email}`}
                                    underline="hover"
                                    color="text.secondary"
                                    sx={{ fontSize: 13.5, overflowWrap: "anywhere" }}
                                >
                                    {CLINIC.email}
                                </Link>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                {/* Bottom Bar */}
                <Box
                    sx={{
                        mt: 6,
                        pt: 3,
                        borderTop: "1px solid #e5e9f0",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        © {new Date().getFullYear()} {CLINIC.name}. Nền tảng quản lý phòng khám và đặt lịch khám trực tuyến.
                    </Typography>
                    <Stack direction="row" spacing={2.5}>
                        <Link component={RouterLink} to="/privacy" underline="hover" variant="caption" color="text.secondary">
                            Chính sách bảo mật
                        </Link>
                        <Link component={RouterLink} to="/contact" underline="hover" variant="caption" color="text.secondary">
                            Liên hệ hỗ trợ
                        </Link>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}
