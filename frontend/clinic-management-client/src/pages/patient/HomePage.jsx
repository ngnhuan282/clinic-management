// src/pages/patient/HomePage.jsx

import HeroSection from "../../components/patient/HeroSection";
import StatsSection from "../../components/patient/StatsSection";
import { Alert, Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { ArrowForward, LocalHospitalOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getDepartments } from "../../api/bookingApi";
import { searchPublicDoctors } from "../../api/doctorApi";
import usePublicResource from "../../hooks/usePublicResource";
import { ResourceState } from "../../components/patient/PublicPage";
import PublicDoctorCard from "../../components/patient/PublicDoctorCard";
import { GUIDES } from "../../data/publicContent";

const getFeaturedDoctors = () => searchPublicDoctors({ pageNumber: 1, pageSize: 3 });

function Section({ title, description, href, children, tint = false }) {
    return (
        <Box component="section" sx={{ py: { xs: 5, md: 7 }, bgcolor: tint ? "#f8fafc" : "#ffffff" }}>
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" }, mb: 4 }}
                >
                    <Box sx={{ maxWidth: 640 }}>
                        <Typography
                            component="h2"
                            sx={{
                                fontWeight: 800,
                                fontSize: { xs: 24, sm: 28, md: 32 },
                                letterSpacing: "-0.02em",
                                color: "#0f2c4d",
                                mb: 1,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: { xs: 14, sm: 15 }, lineHeight: 1.6 }}>
                            {description}
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        to={href}
                        endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                        sx={{
                            alignSelf: "flex-start",
                            flexShrink: 0,
                            fontWeight: 650,
                            fontSize: 14.5,
                            textTransform: "none",
                            borderRadius: "8px",
                            px: 1.5,
                            "&:hover": {
                                bgcolor: "#eff6ff",
                                "& .MuiSvgIcon-root": { transform: "translateX(3px)" },
                            },
                        }}
                    >
                        Xem tất cả
                    </Button>
                </Stack>
                {children}
            </Container>
        </Box>
    );
}

function HomePage() {
    const departments = usePublicResource(getDepartments);
    const doctors = usePublicResource(getFeaturedDoctors);

    return (
        <>
            <HeroSection />
            <StatsSection />

            {/* Specialties Section */}
            <Section
                title="Khám phá chuyên khoa"
                description="Các chuyên khoa lâm sàng và cận lâm sàng đang hoạt động, sẵn sàng tiếp nhận đăng ký khám."
                href="/specialties"
                tint
            >
                <ResourceState resource={departments}>
                    {!departments.data?.length && <Alert severity="info" sx={{ borderRadius: "12px" }}>Chưa có chuyên khoa được công bố.</Alert>}
                    <Grid container spacing={2.5}>
                        {departments.data?.slice(0, 6).map(item => (
                            <Grid key={item.departmentId} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper
                                    component={Link}
                                    to={`/specialties/${item.departmentId}`}
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        display: "flex",
                                        flexDirection: "column",
                                        height: "100%",
                                        textDecoration: "none",
                                        borderRadius: "14px",
                                        borderColor: "#e5e9f0",
                                        bgcolor: "#ffffff",
                                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        "&:hover": {
                                            borderColor: "primary.main",
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 10px 24px rgba(25, 118, 210, 0.1)",
                                            "& .specialty-icon-box": {
                                                bgcolor: "primary.main",
                                                color: "#ffffff",
                                            },
                                            "& .specialty-title": {
                                                color: "primary.main",
                                            },
                                            "& .specialty-arrow": {
                                                transform: "translateX(3px)",
                                                color: "primary.main",
                                            },
                                        },
                                    }}
                                >
                                    <Box
                                        className="specialty-icon-box"
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "10px",
                                            bgcolor: "#eff6ff",
                                            color: "primary.main",
                                            display: "grid",
                                            placeItems: "center",
                                            mb: 2,
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <LocalHospitalOutlined sx={{ fontSize: 24 }} />
                                    </Box>
                                    <Typography
                                        className="specialty-title"
                                        component="h3"
                                        variant="h6"
                                        sx={{
                                            fontWeight: 750,
                                            fontSize: 17,
                                            color: "#1f2937",
                                            mb: 1,
                                            transition: "color 0.15s ease",
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{
                                            fontSize: 13.5,
                                            lineHeight: 1.65,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            flex: 1,
                                        }}
                                    >
                                        {item.description || "Xem thông tin chuyên khoa, đội ngũ bác sĩ và đăng ký lịch khám trực tuyến."}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            mt: 2,
                                            color: "primary.main",
                                            fontSize: 13.5,
                                            fontWeight: 650,
                                        }}
                                    >
                                        Tìm hiểu chuyên khoa
                                        <ArrowForward className="specialty-arrow" sx={{ fontSize: 16, transition: "transform 0.2s ease" }} />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </ResourceState>
            </Section>

            {/* Doctors Section */}
            <Section
                title="Đội ngũ bác sĩ tiêu biểu"
                description="Hồ sơ năng lực, kinh nghiệm lâm sàng và lịch khám được công bố minh bạch để bạn yên tâm lựa chọn."
                href="/doctors"
            >
                <ResourceState resource={doctors}>
                    {!doctors.data?.items?.length && <Alert severity="info" sx={{ borderRadius: "12px" }}>Chưa có bác sĩ được công bố.</Alert>}
                    <Grid container spacing={2.5}>
                        {doctors.data?.items?.map(doctor => (
                            <Grid key={doctor.doctorId} size={{ xs: 12, md: 4 }}>
                                <PublicDoctorCard doctor={doctor} />
                            </Grid>
                        ))}
                    </Grid>
                </ResourceState>
            </Section>

            {/* Health Guides Section */}
            <Section
                title="Chuẩn bị cho buổi khám"
                description="Những hướng dẫn hữu ích giúp bạn và người thân sử dụng dịch vụ khám chữa bệnh thuận tiện nhất."
                href="/health-guide"
                tint
            >
                <Grid container spacing={2.5}>
                    {GUIDES.map(article => (
                        <Grid key={article.slug} size={{ xs: 12, md: 4 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    height: "100%",
                                    borderRadius: "14px",
                                    borderColor: "#e5e9f0",
                                    bgcolor: "#ffffff",
                                    display: "flex",
                                    flexDirection: "column",
                                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        transform: "translateY(-3px)",
                                        boxShadow: "0 10px 24px rgba(25, 118, 210, 0.09)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "inline-block",
                                        alignSelf: "flex-start",
                                        px: 1.25,
                                        py: 0.4,
                                        borderRadius: "6px",
                                        bgcolor: "#eff6ff",
                                        color: "primary.main",
                                        fontWeight: 700,
                                        fontSize: 11.5,
                                        letterSpacing: "0.03em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {article.category}
                                </Box>
                                <Typography
                                    component="h3"
                                    variant="h6"
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: 17,
                                        color: "#1f2937",
                                        my: 1.5,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {article.title}
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        lineHeight: 1.7,
                                        fontSize: 13.5,
                                        mb: 2.5,
                                        flex: 1,
                                    }}
                                >
                                    {article.summary}
                                </Typography>
                                <Button
                                    component={Link}
                                    to={`/health-guide/${article.slug}`}
                                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                    sx={{
                                        alignSelf: "flex-start",
                                        fontWeight: 650,
                                        fontSize: 13.5,
                                        textTransform: "none",
                                        px: 0,
                                        "&:hover": {
                                            bgcolor: "transparent",
                                            color: "primary.dark",
                                            "& .MuiSvgIcon-root": { transform: "translateX(3px)" },
                                        },
                                    }}
                                >
                                    Đọc hướng dẫn
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Section>
        </>
    );
}

export default HomePage;
