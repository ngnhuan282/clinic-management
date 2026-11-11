import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CalendarMonthOutlined, ChevronRight, LocalHospitalOutlined, MedicalServicesOutlined, PersonSearchOutlined } from "@mui/icons-material";

const shortcuts = [
    {
        icon: LocalHospitalOutlined,
        title: "Chuyên khoa",
        text: "Khám phá các khoa điều trị",
        path: "/specialties",
    },
    {
        icon: PersonSearchOutlined,
        title: "Đội ngũ bác sĩ",
        text: "Tra cứu hồ sơ & chuyên môn",
        path: "/doctors",
    },
    {
        icon: MedicalServicesOutlined,
        title: "Dịch vụ & bảng giá",
        text: "Danh mục xét nghiệm công khai",
        path: "/pricing",
    },
    {
        icon: CalendarMonthOutlined,
        title: "Đăng ký khám",
        text: "Chủ động chọn giờ khám trực tuyến",
        path: "/booking",
    },
];

export default function StatsSection() {
    return (
        <Box component="section" aria-label="Truy cập nhanh" sx={{ py: { xs: 3, md: 4.5 }, bgcolor: "#f8fafc" }}>
            <Container maxWidth="lg">
                <Grid container spacing={2}>
                    {shortcuts.map(({ icon: Icon, title, text, path }) => (
                        <Grid key={path} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                component={Link}
                                to={path}
                                variant="outlined"
                                sx={{
                                    display: "flex",
                                    p: 2.2,
                                    gap: 1.75,
                                    alignItems: "center",
                                    textDecoration: "none",
                                    height: "100%",
                                    borderRadius: "12px",
                                    borderColor: "#e5e9f0",
                                    bgcolor: "#ffffff",
                                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        bgcolor: "#ffffff",
                                        transform: "translateY(-3px)",
                                        boxShadow: "0 8px 20px rgba(25, 118, 210, 0.12)",
                                        "& .shortcut-arrow": {
                                            transform: "translateX(3px)",
                                            color: "primary.main",
                                        },
                                        "& .shortcut-icon-box": {
                                            bgcolor: "primary.main",
                                            color: "#ffffff",
                                        },
                                    },
                                }}
                            >
                                <Box
                                    className="shortcut-icon-box"
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "10px",
                                        bgcolor: "#eff6ff",
                                        color: "primary.main",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Icon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 15,
                                            color: "#1f2937",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.4,
                                            fontSize: 12.5,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {text}
                                    </Typography>
                                </Box>
                                <ChevronRight
                                    className="shortcut-arrow"
                                    sx={{
                                        fontSize: 20,
                                        color: "#94a3b8",
                                        transition: "all 0.2s ease",
                                        flexShrink: 0,
                                    }}
                                />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}
