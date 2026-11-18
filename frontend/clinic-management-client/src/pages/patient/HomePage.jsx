import HeroSection from "../../components/patient/HeroSection";
import StatsSection from "../../components/patient/StatsSection";
import { Alert, Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import {
    AccessTimeOutlined,
    ArrowForward,
    CalendarMonthOutlined,
    FolderSharedOutlined,
    LocalHospitalOutlined,
    PhoneInTalkOutlined,
    PriceCheckOutlined,
    SupportAgentOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getDepartments } from "../../api/bookingApi";
import { searchPublicDoctors } from "../../api/doctorApi";
import { useClinicInfo } from "../../api/publicApi";
import usePublicResource from "../../hooks/usePublicResource";
import { ResourceState } from "../../components/patient/PublicPage";
import PublicDoctorCard from "../../components/patient/PublicDoctorCard";
import { GUIDES } from "../../data/publicContent";

const getFeaturedDoctors = () => searchPublicDoctors({ pageNumber: 1, pageSize: 3 });

const CARE_PILLARS = [
    {
        icon: AccessTimeOutlined,
        title: "Chủ động khung giờ khám",
        text: "Theo dõi lịch làm việc thực tế của từng bác sĩ và chọn khung giờ phù hợp mà không phải chờ đợi lâu.",
    },
    {
        icon: PriceCheckOutlined,
        title: "Chi phí niêm yết rõ ràng",
        text: "Phí khám ban đầu, phí sổ khám bệnh và danh mục dịch vụ xét nghiệm được công khai minh bạch.",
    },
    {
        icon: FolderSharedOutlined,
        title: "Hồ sơ y tế liên thông",
        text: "Tra cứu lịch sử khám, đơn thuốc, chỉ số sinh tồn và kết quả xét nghiệm trực tuyến mọi lúc.",
    },
    {
        icon: SupportAgentOutlined,
        title: "Đội ngũ lễ tân tận tâm",
        text: "Hỗ trợ xác nhận lịch hẹn qua điện thoại, hướng dẫn chuẩn bị giấy tờ và tiếp đón chu đáo tại quầy.",
    },
];

function Section({ eyebrow, title, description, href, children, tint = false }) {
    return (
        <Box
            component="section"
            sx={{
                py: { xs: 5.5, md: 7.5 },
                bgcolor: tint ? "#F4F7FA" : "#FFFFFF",
                borderBottom: "1px solid #DCE7F2",
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" }, mb: 4 }}
                >
                    <Box sx={{ maxWidth: 650 }}>
                        {eyebrow && (
                            <Typography
                                sx={{
                                    fontSize: 12.5,
                                    fontWeight: 750,
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    color: "#0B4F8A",
                                    mb: 0.75,
                                }}
                            >
                                {eyebrow}
                            </Typography>
                        )}
                        <Typography
                            component="h2"
                            sx={{
                                fontWeight: 800,
                                fontSize: { xs: 24, sm: 28, md: 32 },
                                letterSpacing: "-0.02em",
                                color: "#0A2540",
                                mb: 1,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 15, sm: 16 }, lineHeight: 1.65, color: "#334155" }}>
                            {description}
                        </Typography>
                    </Box>
                    {href && (
                        <Button
                            component={Link}
                            to={href}
                            variant="outlined"
                            endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                            sx={{
                                alignSelf: { xs: "flex-start", sm: "auto" },
                                flexShrink: 0,
                                fontWeight: 750,
                                fontSize: 14.5,
                                textTransform: "none",
                                borderRadius: "8px",
                                px: 2,
                                bgcolor: "#FFFFFF",
                                borderColor: "#90BCE6",
                                color: "#0B4F8A",
                                "&:hover": {
                                    bgcolor: "#E6F0FA",
                                    borderColor: "#0B4F8A",
                                },
                            }}
                        >
                            Xem tất cả
                        </Button>
                    )}
                </Stack>
                {children}
            </Container>
        </Box>
    );
}

function HomePage() {
    const departments = usePublicResource(getDepartments);
    const doctors = usePublicResource(getFeaturedDoctors);
    const clinic = useClinicInfo();

    return (
        <>
            <HeroSection />
            <StatsSection />

            {/* Specialties Section */}
            <Section
                eyebrow="Khoa & chuyên khoa lâm sàng"
                title="Khám phá chuyên khoa điều trị"
                description="Các khoa lâm sàng và chuyên khoa chuyên sâu đang hoạt động, sẵn sàng tiếp nhận thăm khám và tư vấn sức khỏe."
                href="/specialties"
                tint
            >
                <ResourceState resource={departments}>
                    {!departments.data?.length && (
                        <Alert severity="info" sx={{ borderRadius: "12px" }}>
                            Chưa có chuyên khoa được công bố.
                        </Alert>
                    )}
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
                                        borderColor: "#C5D8EC",
                                        bgcolor: "#FFFFFF",
                                        boxShadow: "0 2px 8px rgba(10, 37, 64, 0.04)",
                                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                                        "&:hover": {
                                            borderColor: "#0B4F8A",
                                            boxShadow: "0 8px 20px rgba(10, 37, 64, 0.09)",
                                            "& .specialty-icon-box": {
                                                bgcolor: "#0B4F8A",
                                                color: "#FFFFFF",
                                            },
                                            "& .specialty-title": {
                                                color: "#0B4F8A",
                                            },
                                        },
                                    }}
                                >
                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Box
                                            className="specialty-icon-box"
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "10px",
                                                bgcolor: "#E6F0FA",
                                                color: "#0B4F8A",
                                                display: "grid",
                                                placeItems: "center",
                                                transition: "background-color 0.15s ease, color 0.15s ease",
                                            }}
                                        >
                                            <LocalHospitalOutlined sx={{ fontSize: 25 }} />
                                        </Box>
                                        {item.code && (
                                            <Chip
                                                label={item.code}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#EAF2FA",
                                                    color: "#0B4F8A",
                                                    border: "1px solid #B8D4F0",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                }}
                                            />
                                        )}
                                    </Stack>

                                    <Typography
                                        className="specialty-title"
                                        component="h3"
                                        variant="h6"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 18,
                                            color: "#0A2540",
                                            mb: 1,
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            lineHeight: 1.65,
                                            color: "#334155",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            flex: 1,
                                        }}
                                    >
                                        {item.description ||
                                            "Xem thông tin chuyên khoa, đội ngũ bác sĩ và đăng ký lịch khám trực tuyến."}
                                    </Typography>

                                    {item.specializations?.length > 0 && (
                                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.75 }}>
                                            {item.specializations.slice(0, 3).map(spec => (
                                                <Chip
                                                    key={spec.specializationId}
                                                    label={spec.name}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        height: 26,
                                                        fontSize: 12,
                                                        fontWeight: 650,
                                                        borderColor: "#90BCE6",
                                                        bgcolor: "#F4F8FC",
                                                        color: "#0A2540",
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    )}

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            mt: 2.25,
                                            pt: 1.5,
                                            borderTop: "1px solid #E2ECF5",
                                            color: "#0B4F8A",
                                            fontSize: 14,
                                            fontWeight: 750,
                                        }}
                                    >
                                        Tìm hiểu khoa & chuyên khoa
                                        <ArrowForward sx={{ fontSize: 16 }} />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </ResourceState>
            </Section>

            {/* Doctors Section */}
            <Section
                eyebrow="Đội ngũ y bác sĩ"
                title="Bác sĩ chuyên khoa giàu kinh nghiệm"
                description="Hồ sơ năng lực, kinh nghiệm lâm sàng và phòng khám tiếp nhận được công bố minh bạch để bạn an tâm lựa chọn."
                href="/doctors"
            >
                <ResourceState resource={doctors}>
                    {!doctors.data?.items?.length && (
                        <Alert severity="info" sx={{ borderRadius: "12px" }}>
                            Chưa có bác sĩ được công bố.
                        </Alert>
                    )}
                    <Grid container spacing={2.5}>
                        {doctors.data?.items?.map(doctor => (
                            <Grid key={doctor.doctorId} size={{ xs: 12, md: 4 }}>
                                <PublicDoctorCard doctor={doctor} />
                            </Grid>
                        ))}
                    </Grid>
                </ResourceState>
            </Section>

            {/* Care Standards Section */}
            <Section
                eyebrow="Giá trị cốt lõi"
                title="Trải nghiệm y tế thân thiện & minh bạch"
                description="Thiết kế lấy người bệnh làm trung tâm, rõ ràng dễ đọc và kết nối thông suốt trước – trong – sau buổi khám."
                tint
            >
                <Grid container spacing={2.5}>
                    {CARE_PILLARS.map(({ icon: Icon, title, text }) => (
                        <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.75,
                                    height: "100%",
                                    borderRadius: "14px",
                                    borderColor: "#C5D8EC",
                                    bgcolor: "#FFFFFF",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: "10px",
                                        bgcolor: "#E6F0FA",
                                        color: "#0B4F8A",
                                        display: "grid",
                                        placeItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Icon sx={{ fontSize: 24 }} />
                                </Box>
                                <Typography component="h3" sx={{ fontWeight: 750, fontSize: 16.5, color: "#0A2540", mb: 1 }}>
                                    {title}
                                </Typography>
                                <Typography sx={{ fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
                                    {text}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Section>

            {/* Health Guides Section */}
            <Section
                eyebrow="Cẩm nang khách hàng"
                title="Chuẩn bị chu đáo cho buổi khám"
                description="Những hướng dẫn ngắn gọn, dễ hiểu giúp bạn và người thân chủ động giấy tờ, sổ khám và quy trình tiếp nhận."
                href="/health-guide"
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
                                    borderColor: "#C5D8EC",
                                    bgcolor: "#FFFFFF",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "border-color 0.15s ease",
                                    "&:hover": {
                                        borderColor: "#0B4F8A",
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
                                        bgcolor: "#EAF2FA",
                                        border: "1px solid #90BCE6",
                                        color: "#0B4F8A",
                                        fontWeight: 750,
                                        fontSize: 12,
                                        letterSpacing: "0.02em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {article.category}
                                </Box>
                                <Typography
                                    component="h3"
                                    variant="h6"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 17.5,
                                        color: "#0A2540",
                                        my: 1.5,
                                        lineHeight: 1.38,
                                    }}
                                >
                                    {article.title}
                                </Typography>
                                <Typography
                                    sx={{
                                        lineHeight: 1.7,
                                        fontSize: 14,
                                        color: "#334155",
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
                                        fontWeight: 750,
                                        fontSize: 14,
                                        textTransform: "none",
                                        px: 0,
                                        color: "#0B4F8A",
                                        "&:hover": {
                                            bgcolor: "transparent",
                                            color: "#083A66",
                                        },
                                    }}
                                >
                                    Đọc hướng dẫn
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Bottom Solid Deep Blue Callout */}
                <Paper
                    elevation={0}
                    sx={{
                        mt: 6,
                        p: { xs: 3, sm: 4, md: 4.5 },
                        borderRadius: "18px",
                        bgcolor: "#0B3B68",
                        color: "#FFFFFF",
                        border: "1px solid #082D50",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={3}
                        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
                    >
                        <Box sx={{ maxWidth: 600 }}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "#BAE6FD", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                                Sẵn sàng đồng hành cùng bạn
                            </Typography>
                            <Typography component="h2" sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                                Đặt lịch khám nhanh chóng ngay hôm nay
                            </Typography>
                            <Typography sx={{ fontSize: 15, color: "#E6F0FA", lineHeight: 1.7 }}>
                                Bạn có thể đăng ký khám trực tuyến dù đã có hay chưa có tài khoản. Tổng đài {clinic.phone} luôn sẵn sàng hỗ trợ trong khung giờ {clinic.hours}.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexShrink: 0 }}>
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    bgcolor: "#FFFFFF",
                                    color: "#0A2540",
                                    fontWeight: 800,
                                    borderRadius: "10px",
                                    px: 3,
                                    "&:hover": { bgcolor: "#E6F0FA" },
                                }}
                            >
                                Đăng ký lịch khám
                            </Button>
                            <Button
                                component="a"
                                href={clinic.phoneHref}
                                variant="outlined"
                                size="large"
                                startIcon={<PhoneInTalkOutlined />}
                                sx={{
                                    borderColor: "rgba(255,255,255,0.5)",
                                    color: "#FFFFFF",
                                    fontWeight: 750,
                                    borderRadius: "10px",
                                    px: 2.5,
                                    "&:hover": { borderColor: "#FFFFFF", bgcolor: "#0F528C" },
                                }}
                            >
                                Gọi {clinic.phone}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Section>
        </>
    );
}

export default HomePage;
