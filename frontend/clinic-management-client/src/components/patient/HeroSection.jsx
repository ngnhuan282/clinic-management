import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Container, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { ArrowForward, CalendarMonthOutlined, CheckCircleOutlined, LocalHospitalOutlined, PersonSearchOutlined, Search, ShieldOutlined } from "@mui/icons-material";

export default function HeroSection() {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                py: { xs: 5, md: 8, lg: 9 },
                background: "radial-gradient(ellipse at 80% 20%, rgba(224, 242, 254, 0.6) 0%, rgba(245, 249, 253, 0.9) 50%, #ffffff 100%)",
                borderBottom: "1px solid #e5e9f0",
                overflow: "hidden",
            }}
        >
            {/* Subtle decorative background elements */}
            <Box
                aria-hidden="true"
                sx={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    bgcolor: "rgba(25, 118, 210, 0.04)",
                    pointerEvents: "none",
                }}
            />
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={{ xs: 4, md: 6, lg: 8 }}
                    sx={{ alignItems: "center" }}
                >
                    {/* Left Column: Heading & Search */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Chip
                            icon={<ShieldOutlined sx={{ fontSize: 16 }} />}
                            label="Cổng y tế & chăm sóc sức khỏe gia đình"
                            variant="outlined"
                            color="primary"
                            sx={{
                                mb: 2.5,
                                fontSize: { xs: 12, sm: 13 },
                                fontWeight: 600,
                                bgcolor: "rgba(25, 118, 210, 0.05)",
                                borderColor: "#bae6fd",
                                py: 0.5,
                            }}
                        />

                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 32, sm: 40, md: 46 },
                                fontWeight: 800,
                                lineHeight: 1.2,
                                letterSpacing: "-0.025em",
                                color: "#0f2c4d",
                                mb: 2,
                            }}
                        >
                            Chăm sóc sức khỏe,<br />
                            <Box component="span" sx={{ color: "primary.main" }}>
                                bắt đầu từ sự chủ động.
                            </Box>
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: 15, sm: 16 },
                                lineHeight: 1.8,
                                mb: 3.5,
                                maxWidth: 540,
                            }}
                        >
                            Tra cứu chuyên khoa, tìm hiểu hồ sơ bác sĩ và chủ động chọn khung giờ khám phù hợp. Mọi thủ tục đăng ký tiện lợi, minh bạch ngay trong tầm tay.
                        </Typography>

                        {/* CTA Buttons */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ mb: 3.5 }}
                        >
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    px: 3,
                                    py: 1.25,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.25)",
                                    "&:hover": {
                                        boxShadow: "0 6px 16px rgba(25, 118, 210, 0.35)",
                                    },
                                }}
                            >
                                Đặt lịch khám trực tuyến
                            </Button>
                            <Button
                                component={Link}
                                to="/about"
                                variant="outlined"
                                size="large"
                                sx={{
                                    borderRadius: "10px",
                                    px: 2.5,
                                    py: 1.25,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: "#1e3a8a",
                                    borderColor: "#cbd5e1",
                                    bgcolor: "#ffffff",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        bgcolor: "#eff6ff",
                                    },
                                }}
                            >
                                Tìm hiểu phòng khám
                            </Button>
                        </Stack>

                        {/* Doctor Search Form */}
                        <Paper
                            component="form"
                            elevation={0}
                            onSubmit={e => {
                                e.preventDefault();
                                navigate("/doctors" + (query.trim() ? "?fullName=" + encodeURIComponent(query.trim()) : ""));
                            }}
                            sx={{
                                p: 0.75,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                borderRadius: "12px",
                                border: "1px solid #cbd5e1",
                                bgcolor: "#ffffff",
                                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                                maxWidth: 540,
                                transition: "all 0.2s ease",
                                "&:focus-within": {
                                    borderColor: "primary.main",
                                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.15)",
                                },
                            }}
                        >
                            <TextField
                                placeholder="Tìm bác sĩ theo tên (VD: Nguyễn Văn A)..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{
                                    htmlInput: { maxLength: 100, "aria-label": "Tìm bác sĩ theo tên" },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: "text.secondary", ml: 0.5 }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                    "& .MuiOutlinedInput-root": { bgcolor: "transparent", minHeight: 40 },
                                    "& input": { fontSize: 14.5 },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                aria-label="Tìm bác sĩ"
                                sx={{
                                    minWidth: 44,
                                    height: 42,
                                    px: 2,
                                    borderRadius: "8px",
                                    flexShrink: 0,
                                    fontWeight: 600,
                                }}
                            >
                                <Search sx={{ fontSize: 20 }} />
                            </Button>
                        </Paper>
                    </Box>

                    {/* Right Column: Hero Showcase Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            flex: 0.9,
                            width: { xs: "100%", md: "auto" },
                            p: { xs: 3, sm: 4 },
                            background: "linear-gradient(135deg, #0a4f8f 0%, #083c6d 100%)",
                            color: "white",
                            borderRadius: "20px",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 12px 32px rgba(10, 79, 143, 0.22)",
                        }}
                    >
                        <Box
                            aria-hidden="true"
                            sx={{
                                position: "absolute",
                                width: 240,
                                height: 240,
                                borderRadius: "50%",
                                bgcolor: "rgba(255, 255, 255, 0.06)",
                                top: -70,
                                right: -70,
                            }}
                        />
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "12px",
                                bgcolor: "rgba(255, 255, 255, 0.12)",
                                display: "grid",
                                placeItems: "center",
                                mb: 2.5,
                            }}
                        >
                            <LocalHospitalOutlined sx={{ fontSize: 32, color: "#93c5fd" }} />
                        </Box>

                        <Typography
                            component="h2"
                            variant="h5"
                            sx={{
                                fontWeight: 750,
                                mb: 3,
                                color: "white",
                                fontSize: { xs: 20, sm: 22 },
                                lineHeight: 1.35,
                            }}
                        >
                            Một hành trình khám<br />rõ ràng, thuận tiện
                        </Typography>

                        <Stack spacing={2.5}>
                            {[
                                [PersonSearchOutlined, "Chọn chuyên khoa & bác sĩ", "Hồ sơ kinh nghiệm và đánh giá công khai"],
                                [CalendarMonthOutlined, "Chọn ngày & giờ phù hợp", "Xem trước các khung giờ trống theo thời gian thực"],
                                [CheckCircleOutlined, "Nhận mã hẹn & xác nhận", "Tiếp nhận nhanh chóng tại quầy lễ tân"],
                            ].map(([Icon, title, text]) => (
                                <Stack key={title} direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                                    <Box
                                        sx={{
                                            bgcolor: "rgba(255, 255, 255, 0.12)",
                                            p: 1.1,
                                            borderRadius: "10px",
                                            display: "flex",
                                            color: "#93c5fd",
                                            flexShrink: 0,
                                            mt: 0.25,
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 650, fontSize: 14.5, color: "#ffffff" }}>
                                            {title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#bfdbfe", mt: 0.3, fontSize: 13, lineHeight: 1.5 }}>
                                            {text}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>

                        <Button
                            component={Link}
                            to="/health-guide"
                            endIcon={<ArrowForward />}
                            sx={{
                                mt: 3.5,
                                color: "#ffffff",
                                textTransform: "none",
                                fontWeight: 650,
                                px: 1,
                                py: 0.5,
                                borderRadius: "6px",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                            }}
                        >
                            Xem hướng dẫn chuẩn bị trước khi khám
                        </Button>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}
