// src/pages/patient/HomePage.jsx

import HeroSection from "../../components/patient/HeroSection";
import StatsSection from "../../components/patient/StatsSection";
import { Alert, Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getDepartments } from "../../api/bookingApi";
import { searchPublicDoctors } from "../../api/doctorApi";
import usePublicResource from "../../hooks/usePublicResource";
import { ResourceState } from "../../components/patient/PublicPage";
import PublicDoctorCard from "../../components/patient/PublicDoctorCard";
import { GUIDES } from "../../data/publicContent";

const getFeaturedDoctors = () => searchPublicDoctors({ pageNumber: 1, pageSize: 3 });

function Section({ title, description, href, children, tint = false }) {
    return <Box component="section" sx={{ py: { xs: 4, md: 6 }, bgcolor: tint ? "#f7faff" : "white" }}><Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }}  spacing={2} sx={{ justifyContent: "space-between",  mb: 3  }}>
            <Box><Typography component="h2" variant="h4"  sx={{ fontWeight: 750,  fontSize: { xs: 25, md: 30 }, mb: 1  }}>{title}</Typography><Typography color="text.secondary">{description}</Typography></Box>
            <Button component={Link} to={href} endIcon={<ArrowForward />} sx={{ alignSelf: "flex-start", flexShrink: 0 }}>Xem tất cả</Button>
        </Stack>{children}
    </Container></Box>;
}

function HomePage() {
    const departments = usePublicResource(getDepartments);
    const doctors = usePublicResource(getFeaturedDoctors);
    return (
        <>
            <HeroSection />
            <StatsSection />
            <Section title="Tìm chuyên khoa phù hợp" description="Thông tin chuyên khoa và đội ngũ bác sĩ đang tiếp nhận khám." href="/specialties" tint>
                <ResourceState resource={departments}>
                    {!departments.data?.length && <Alert severity="info">Chưa có chuyên khoa được công bố.</Alert>}
                    <Grid container spacing={2}>{departments.data?.slice(0, 6).map(item => <Grid key={item.departmentId} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Paper component={Link} to={`/specialties/${item.departmentId}`} variant="outlined" sx={{ p: 3, display: "block", height: "100%", textDecoration: "none", borderRadius: 3, "&:hover": { borderColor: "primary.main" } }}>
                            <Typography component="h3" variant="h6" color="primary"   sx={{ fontWeight: 700, mb: 1 }}>{item.name}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description || "Xem chuyên khoa, tìm bác sĩ và đăng ký lịch khám."}</Typography>
                        </Paper>
                    </Grid>)}</Grid>
                </ResourceState>
            </Section>
            <Section title="Đội ngũ bác sĩ" description="Xem hồ sơ, kinh nghiệm và giờ khám để chủ động lựa chọn." href="/doctors">
                <ResourceState resource={doctors}>
                    {!doctors.data?.items?.length && <Alert severity="info">Chưa có bác sĩ được công bố.</Alert>}
                    <Grid container spacing={2}>{doctors.data?.items?.map(doctor => <Grid key={doctor.doctorId} size={{ xs: 12, md: 4 }}><PublicDoctorCard doctor={doctor} /></Grid>)}</Grid>
                </ResourceState>
            </Section>
            <Section title="Chuẩn bị cho buổi khám" description="Những hướng dẫn giúp bạn sử dụng dịch vụ thuận tiện hơn." href="/health-guide" tint>
                <Grid container spacing={2}>{GUIDES.map(article => <Grid key={article.slug} size={{ xs: 12, md: 4 }}><Paper variant="outlined" sx={{ p: 3, height: "100%", borderRadius: 3 }}>
                    <Typography variant="overline" color="primary">{article.category}</Typography><Typography component="h3" variant="h6"   sx={{ fontWeight: 700, my: 1 }}>{article.title}</Typography><Typography color="text.secondary"   sx={{ lineHeight: 1.8, mb: 2 }}>{article.summary}</Typography><Button component={Link} to={`/health-guide/${article.slug}`} endIcon={<ArrowForward />}>Đọc hướng dẫn</Button>
                </Paper></Grid>)}</Grid>
            </Section>
        </>
    );
}

export default HomePage;
