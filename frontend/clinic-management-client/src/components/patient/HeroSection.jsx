import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Container, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import {
    AccessTimeOutlined,
    ArrowForward,
    CalendarMonthOutlined,
    CheckCircleOutlined,
    HealthAndSafetyOutlined,
    LocalHospitalOutlined,
    PersonSearchOutlined,
    PhoneInTalkOutlined,
    Search,
    VerifiedOutlined,
} from "@mui/icons-material";
import { useClinicInfo } from "../../api/publicApi";

export default function HeroSection() {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const clinic = useClinicInfo();

    return (
        <Box
            component="section"
            sx={{
                py: { xs: 5, md: 7, lg: 8 },
                bgcolor: "#EAF2FA",
                borderBottom: "1px solid #C5D8EC",
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={{ xs: 4, md: 5.5, lg: 7 }}
                    sx={{ alignItems: "center" }}
                >
                    {/* Left Column: Headline, Search & Trust Highlights */}
                    <Box sx={{ flex: 1.08, minWidth: 0, width: "100%" }}>
                        <Chip
                            icon={<HealthAndSafetyOutlined sx={{ fontSize: 18 }} />}
                            label="Chăm sóc y tế hiện đại · Tận tâm vì người bệnh"
                            variant="outlined"
                            color="primary"
                            sx={{
                                mb: 2.25,
                                fontSize: { xs: 12.5, sm: 13.5 },
                                fontWeight: 700,
                                bgcolor: "#FFFFFF",
                                borderColor: "#90BCE6",
                                color: "#0B4F8A",
                                borderRadius: "8px",
                                px: 0.5,
                                py: 0.5,
                            }}
                        />

                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 30, sm: 38, md: 44 },
                                fontWeight: 800,
                                lineHeight: 1.22,
                                letterSpacing: "-0.02em",
                                color: "#0A2540",
                                mb: 2,
                            }}
                        >
                            Chăm sóc sức khỏe,
                            <br />
                            <Box component="span" sx={{ color: "#0B4F8A" }}>
                                bắt đầu từ sự chủ động.
                            </Box>
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: { xs: 15.5, sm: 16.5 },
                                lineHeight: 1.8,
                                mb: 3.25,
                                maxWidth: 550,
                                color: "#1E293B",
                            }}
                        >
                            Tra cứu chuyên khoa, xem thông tin bác sĩ và đặt lịch khám trực tuyến chỉ trong vài phút. Quy trình tiếp nhận rõ ràng, chi phí minh bạch và dễ sử dụng cho mọi lứa tuổi.
                        </Typography>

                        {/* Primary CTA Row */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3.25 }}>
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    px: 3,
                                    py: 1.4,
                                    fontWeight: 750,
                                    fontSize: 15.5,
                                    bgcolor: "#0B4F8A",
                                    "&:hover": { bgcolor: "#083A66" },
                                }}
                            >
                                Đặt lịch khám trực tuyến
                            </Button>
                            <Button
                                component={Link}
                                to="/doctors"
                                variant="outlined"
                                size="large"
                                startIcon={<PersonSearchOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    px: 2.5,
                                    py: 1.4,
                                    fontWeight: 700,
                                    fontSize: 15.5,
                                    color: "#0A2540",
                                    borderColor: "#90BCE6",
                                    bgcolor: "#FFFFFF",
                                    "&:hover": {
                                        borderColor: "#0B4F8A",
                                        bgcolor: "#F4F8FC",
                                        color: "#0B4F8A",
                                    },
                                }}
                            >
                                Tìm bác sĩ chuyên khoa
                            </Button>
                        </Stack>

                        {/* Quick Doctor Search Form */}
                        <Paper
                            component="form"
                            elevation={0}
                            onSubmit={e => {
                                e.preventDefault();
                                navigate(
                                    "/doctors" + (query.trim() ? "?fullName=" + encodeURIComponent(query.trim()) : "")
                                );
                            }}
                            sx={{
                                p: 0.75,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                borderRadius: "12px",
                                border: "2px solid #90BCE6",
                                bgcolor: "#FFFFFF",
                                maxWidth: 550,
                                "&:focus-within": {
                                    borderColor: "#0B4F8A",
                                },
                            }}
                        >
                            <TextField
                                placeholder="Tìm nhanh bác sĩ theo họ tên (VD: Nguyễn Văn A)..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{
                                    htmlInput: { maxLength: 100, "aria-label": "Tìm bác sĩ theo tên" },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: "#0B4F8A", ml: 0.5 }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "transparent",
                                        minHeight: 44,
                                    },
                                    "& input": { fontSize: 15, color: "#0A2540" },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                aria-label="Tìm bác sĩ"
                                sx={{
                                    minWidth: 48,
                                    height: 44,
                                    px: 2.25,
                                    borderRadius: "8px",
                                    flexShrink: 0,
                                    fontWeight: 700,
                                    bgcolor: "#0B4F8A",
                                    "&:hover": { bgcolor: "#083A66" },
                                }}
                            >
                                <Search sx={{ fontSize: 21 }} />
                            </Button>
                        </Paper>

                        {/* Reassuring Medical Trust Badges */}
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: { xs: 1.5, sm: 2.5 }, mt: 2.75 }}>
                            {[
                                "Đặt hẹn miễn phí",
                                "Giá dịch vụ niêm yết",
                                "Bảo mật bệnh án điện tử",
                            ].map(item => (
                                <Stack key={item} direction="row" spacing={0.65} sx={{ alignItems: "center" }}>
                                    <VerifiedOutlined sx={{ fontSize: 18, color: "#0B4F8A" }} />
                                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0A2540" }}>
                                        {item}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    {/* Right Column: Solid Deep Blue Care Journey Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            flex: 0.92,
                            width: { xs: "100%", md: "auto" },
                            p: { xs: 3, sm: 4 },
                            bgcolor: "#0B3B68",
                            color: "#FFFFFF",
                            borderRadius: "18px",
                            border: "1px solid #082D50",
                            boxShadow: "0 12px 28px rgba(10, 37, 64, 0.16)",
                        }}
                    >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.75 }}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "12px",
                                    bgcolor: "#0F528C",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <LocalHospitalOutlined sx={{ fontSize: 28, color: "#BAE6FD" }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.04em", color: "#BAE6FD", textTransform: "uppercase" }}>
                                    Quy trình 3 bước đơn giản
                                </Typography>
                                <Typography
                                    component="h2"
                                    variant="h5"
                                    sx={{
                                        fontWeight: 800,
                                        color: "#FFFFFF",
                                        fontSize: { xs: 20, sm: 22 },
                                        lineHeight: 1.3,
                                    }}
                                >
                                    Hành trình khám rõ ràng
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack spacing={2}>
                            {[
                                [
                                    PersonSearchOutlined,
                                    "1. Chọn chuyên khoa & bác sĩ",
                                    "Tham khảo chuyên môn, kinh nghiệm và phòng khám tiếp nhận",
                                ],
                                [
                                    CalendarMonthOutlined,
                                    "2. Chọn ngày & khung giờ trống",
                                    "Xem lịch trực thực tế và đặt giữ chỗ phù hợp thời gian của bạn",
                                ],
                                [
                                    CheckCircleOutlined,
                                    "3. Tiếp nhận thuận tiện tại quầy",
                                    "Nhận mã hẹn rõ ràng, lễ tân hỗ trợ xác nhận và hướng dẫn chu đáo",
                                ],
                            ].map(([Icon, title, text]) => (
                                <Stack
                                    key={title}
                                    direction="row"
                                    spacing={1.75}
                                    sx={{
                                        alignItems: "flex-start",
                                        p: 1.75,
                                        borderRadius: "12px",
                                        bgcolor: "#0F4C81",
                                        border: "1px solid rgba(255, 255, 255, 0.16)",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            bgcolor: "#1565C0",
                                            p: 1,
                                            borderRadius: "8px",
                                            display: "flex",
                                            color: "#FFFFFF",
                                            flexShrink: 0,
                                            mt: 0.15,
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 750, fontSize: 15, color: "#FFFFFF" }}>
                                            {title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "#E6F0FA", mt: 0.3, fontSize: 13.5, lineHeight: 1.55 }}
                                        >
                                            {text}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>

                        <Box
                            sx={{
                                mt: 2.75,
                                pt: 2.25,
                                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                justifyContent: "space-between",
                                alignItems: { xs: "flex-start", sm: "center" },
                                gap: 1.5,
                            }}
                        >
                            <Stack spacing={0.4}>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "#E6F0FA" }}>
                                    <AccessTimeOutlined sx={{ fontSize: 16 }} />
                                    <Typography sx={{ fontSize: 13 }}>{clinic.hours}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "#FFFFFF" }}>
                                    <PhoneInTalkOutlined sx={{ fontSize: 16, color: "#BAE6FD" }} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 750 }}>
                                        Tư vấn: {clinic.phone}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Button
                                component={Link}
                                to="/health-guide"
                                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                sx={{
                                    color: "#0A2540",
                                    bgcolor: "#FFFFFF",
                                    textTransform: "none",
                                    fontWeight: 750,
                                    fontSize: 13.5,
                                    px: 2,
                                    py: 0.85,
                                    minHeight: 40,
                                    borderRadius: "8px",
                                    "&:hover": { bgcolor: "#E6F0FA" },
                                }}
                            >
                                Cẩm nang đi khám
                            </Button>
                        </Box>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}
