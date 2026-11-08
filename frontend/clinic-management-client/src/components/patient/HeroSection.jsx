import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Container, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { ArrowForward, CalendarMonthOutlined, CheckCircleOutlined, LocalHospitalOutlined, PersonSearchOutlined, Search } from "@mui/icons-material";

export default function HeroSection() {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    return <Box component="section" sx={{ py: { xs: 5, md: 8 }, background: "linear-gradient(125deg, #f1f7fe, #ffffff 70%)" }}>
        <Container maxWidth="lg"><Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 4, md: 7 }}  sx={{ alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Chip label="Cổng chăm sóc sức khỏe cho bạn & gia đình" variant="outlined" color="primary" sx={{ mb: 3, maxWidth: "100%", fontSize: { xs: 11, sm: 13 } }} />
                <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 42, md: 48 }, fontWeight: 850, lineHeight: 1.2, letterSpacing: -1.5, color: "#15395b", mb: 2.5 }}>Chăm sóc sức khỏe,<br /><Box component="span"  sx={{ color: "primary.main" }}>bắt đầu từ sự chủ động.</Box></Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3, maxWidth: 520 }}>Tìm chuyên khoa, lựa chọn bác sĩ và đăng ký giờ khám phù hợp. Mọi thông tin cần thiết cho buổi khám, ngay trong tầm tay bạn.</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}  sx={{ mb: 3 }}><Button component={Link} to="/booking" variant="contained" size="large" startIcon={<CalendarMonthOutlined />}>Đặt lịch khám trực tuyến</Button><Button component={Link} to="/about" variant="outlined" size="large">Tìm hiểu phòng khám</Button></Stack>
                <Box component="form" onSubmit={e => { e.preventDefault(); navigate("/doctors" + (query.trim() ? "?fullName=" + encodeURIComponent(query.trim()) : "")); }} sx={{ display: "flex", gap: 1 }}>
                    <TextField label="Tìm bác sĩ theo tên" value={query} onChange={e => setQuery(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { maxLength: 100 }, input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
                    <Button type="submit" variant="contained" aria-label="Tìm bác sĩ"><Search /></Button>
                </Box>
            </Box>
            <Paper elevation={0} sx={{ flex: 0.85, width: { xs: "100%", md: "auto" }, p: { xs: 3, md: 4 }, bgcolor: "#075a9b", color: "white", borderRadius: 5, position: "relative", overflow: "hidden" }}>
                <Box aria-hidden="true" sx={{ position: "absolute", width: 230, height: 230, borderRadius: "50%", bgcolor: "#ffffff0a", top: -85, right: -80 }} />
                <LocalHospitalOutlined sx={{ fontSize: 48, mb: 2, color: "#b6e4ff" }} />
                <Typography component="h2" variant="h5" sx={{ fontWeight: 750, mb: 3, color: "white" }}>Một hành trình khám<br />rõ ràng, thuận tiện.</Typography>
                <Stack spacing={3}>{[
                    [PersonSearchOutlined, "Chọn chuyên khoa & bác sĩ", "Hồ sơ và đánh giá công khai"],
                    [CalendarMonthOutlined, "Chọn ngày & giờ phù hợp", "Xem giờ trống trước khi đăng ký"],
                    [CheckCircleOutlined, "Nhận xác nhận từ phòng khám", "Lưu mã lịch hẹn sau khi gửi"],
                ].map(([Icon, title, text]) => <Stack key={title} direction="row" spacing={2}  sx={{ alignItems: "center" }}><Box sx={{ bgcolor: "#ffffff15", p: 1.25, borderRadius: 2, display: "flex" }}><Icon /></Box><Box><Typography  sx={{ fontWeight: 650 }}>{title}</Typography><Typography variant="body2" sx={{ color: "#d1e7f9", mt: 0.5 }}>{text}</Typography></Box></Stack>)}</Stack>
                <Button component={Link} to="/health-guide" endIcon={<ArrowForward />} sx={{ mt: 3, color: "white", px: 0 }}>Hướng dẫn trước khi đến khám</Button>
            </Paper>
        </Stack></Container>
    </Box>;
}
