import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";
import {
    AccessTimeOutlined,
    EmailOutlined,
    HealthAndSafetyOutlined,
    LocalHospital,
    LocationOnOutlined,
    PhoneInTalkOutlined,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useClinicInfo } from "../../api/publicApi";

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
    const clinic = useClinicInfo();
    return (
        <Box
            component="footer"
            sx={{
                mt: "auto",
                pt: { xs: 6, md: 7.5 },
                pb: 4,
                bgcolor: "#EAF2FA",
                borderTop: "2px solid #C5D8EC",
                color: "text.primary",
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={{ xs: 4, md: 5 }}>
                    {/* Brand Info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={2.25}>
                            <Box sx={{ display: "flex", gap: 1.35, alignItems: "center" }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "#0B4F8A",
                                        color: "#FFFFFF",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <LocalHospital sx={{ fontSize: 25 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 17,
                                            lineHeight: 1.2,
                                            color: "#0A2540",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {clinic.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12.5, color: "#0B4F8A", fontWeight: 650, mt: 0.25 }}>
                                        {clinic.tagline}
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ lineHeight: 1.8, maxWidth: 360, color: "#334155" }}>
                                {clinic.description}
                            </Typography>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    bgcolor: "#FFFFFF",
                                    border: "1px solid #B8CCE0",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "10px",
                                        bgcolor: "#0B4F8A",
                                        color: "#FFFFFF",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <PhoneInTalkOutlined fontSize="small" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569" }}>
                                        Tổng đài tư vấn & đặt lịch
                                    </Typography>
                                    <Link
                                        href={clinic.phoneHref}
                                        underline="hover"
                                        sx={{
                                            fontSize: 19,
                                            fontWeight: 800,
                                            color: "#0B4F8A",
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {clinic.phone}
                                    </Link>
                                </Box>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Navigation Columns */}
                    {groups.map(({ title, links }) => (
                        <Grid key={title} size={{ xs: 6, md: 2.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 15.5, mb: 2.2, color: "#0A2540" }}>
                                {title}
                            </Typography>
                            <Stack spacing={1.4}>
                                {links.map(([label, path]) => (
                                    <Link
                                        key={path}
                                        component={RouterLink}
                                        to={path}
                                        underline="hover"
                                        sx={{
                                            fontSize: 14.5,
                                            color: "#1E293B",
                                            fontWeight: 550,
                                            "&:hover": { color: "#0B4F8A" },
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
                        <Typography sx={{ fontWeight: 800, fontSize: 15.5, mb: 2.2, color: "#0A2540" }}>
                            Cơ sở & giờ làm việc
                        </Typography>
                        <Stack spacing={2}>
                            {clinic.locations.map(location => (
                                <Box key={location.name} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                    <LocationOnOutlined sx={{ fontSize: 20, color: "#0B4F8A", mt: 0.25, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540" }}>
                                            {location.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontSize: 13.5, lineHeight: 1.6, color: "#334155", overflowWrap: "anywhere" }}
                                        >
                                            {location.address}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}

                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                <AccessTimeOutlined sx={{ fontSize: 20, color: "#0B4F8A", mt: 0.25, flexShrink: 0 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#0A2540" }}>
                                        Giờ tiếp nhận
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: 13.5, color: "#334155" }}>
                                        {clinic.hours}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                                <EmailOutlined sx={{ fontSize: 20, color: "#0B4F8A", flexShrink: 0 }} />
                                <Link
                                    href={`mailto:${clinic.email}`}
                                    underline="hover"
                                    sx={{ fontSize: 14, color: "#1E293B", overflowWrap: "anywhere", fontWeight: 550 }}
                                >
                                    {clinic.email}
                                </Link>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                {/* Bottom Bar */}
                <Box
                    sx={{
                        mt: 5.5,
                        pt: 3,
                        borderTop: "1px solid #C5D8EC",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <HealthAndSafetyOutlined sx={{ fontSize: 18, color: "#0B4F8A" }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                            © {new Date().getFullYear()} {clinic.name}. Hệ thống quản lý phòng khám & đặt lịch khám trực tuyến.
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2.5}>
                        <Link component={RouterLink} to="/privacy" underline="hover" variant="caption" sx={{ color: "#0A2540", fontWeight: 700, fontSize: 13 }}>
                            Chính sách bảo mật
                        </Link>
                        <Link component={RouterLink} to="/contact" underline="hover" variant="caption" sx={{ color: "#0A2540", fontWeight: 700, fontSize: 13 }}>
                            Liên hệ hỗ trợ
                        </Link>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}
