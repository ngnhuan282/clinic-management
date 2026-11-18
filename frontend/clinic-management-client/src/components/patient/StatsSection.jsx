import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import {
    CalendarMonthOutlined,
    ChevronRight,
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    PersonSearchOutlined,
} from "@mui/icons-material";

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
        text: "Chủ động chọn giờ trực tuyến",
        path: "/booking",
    },
];

export default function StatsSection() {
    return (
        <Box
            component="section"
            aria-label="Truy cập nhanh"
            sx={{ py: { xs: 3, md: 4 }, bgcolor: "#FFFFFF", borderBottom: "1px solid #DCE7F2" }}
        >
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
                                    p: 2.25,
                                    gap: 1.75,
                                    alignItems: "center",
                                    textDecoration: "none",
                                    height: "100%",
                                    borderRadius: "14px",
                                    borderColor: "#C5D8EC",
                                    bgcolor: "#FFFFFF",
                                    transition: "border-color 0.15s ease, background-color 0.15s ease",
                                    "&:hover": {
                                        borderColor: "#0B4F8A",
                                        bgcolor: "#F4F8FC",
                                        "& .shortcut-arrow": {
                                            color: "#0B4F8A",
                                        },
                                        "& .shortcut-icon-box": {
                                            bgcolor: "#0B4F8A",
                                            color: "#FFFFFF",
                                        },
                                    },
                                }}
                            >
                                <Box
                                    className="shortcut-icon-box"
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "10px",
                                        bgcolor: "#E6F0FA",
                                        color: "#0B4F8A",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                        transition: "background-color 0.15s ease, color 0.15s ease",
                                    }}
                                >
                                    <Icon sx={{ fontSize: 25 }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 750,
                                            fontSize: 15.5,
                                            color: "#0A2540",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 0.35,
                                            fontSize: 13,
                                            color: "#475569",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {text}
                                    </Typography>
                                </Box>
                                <ChevronRight
                                    className="shortcut-arrow"
                                    sx={{
                                        fontSize: 20,
                                        color: "#64748B",
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
