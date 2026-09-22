import { Box, Breadcrumbs, Container, Divider, Link, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { BadgeOutlined, CalendarMonthOutlined, CheckCircleOutlined, ChevronRight, HomeOutlined, LockOutlined, LoginOutlined, PersonAddAltOutlined, PersonOutlined, PhoneOutlined, ShieldOutlined } from "@mui/icons-material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AuthForm from "./AuthForm";

const FEATURES = [
    { icon: BadgeOutlined, title: "Một tài khoản, kết nối phòng khám", description: "Sử dụng thông tin cá nhân thống nhất khi đăng ký và đặt lịch khám." },
    { icon: CalendarMonthOutlined, title: "Chủ động chọn lịch khám", description: "Tìm khoa, chọn bác sĩ và khung giờ còn trống phù hợp với bạn." },
    { icon: CheckCircleOutlined, title: "Đăng ký dễ dàng", description: "Tạo tài khoản bệnh nhân chỉ với thông tin liên hệ và mật khẩu của bạn." },
    { icon: ShieldOutlined, title: "Quản lý truy cập tài khoản", description: "Đăng nhập bằng mật khẩu và chủ động kết thúc phiên khi sử dụng xong." },
];

const SUPPORT_CARDS = [
    { icon: PersonOutlined, title: "Tài khoản dành cho bệnh nhân", description: "Đăng ký một lần để bắt đầu sử dụng dịch vụ đặt lịch khám trực tuyến.", color: "#1976d2", background: "#eff6ff" },
    { icon: PhoneOutlined, title: "Thông tin liên hệ chính xác", description: "Kiểm tra số điện thoại và email khi đăng ký để phòng khám có thể liên hệ với bạn.", color: "#10b981", background: "#ecfdf5" },
    { icon: LockOutlined, title: "Giữ an toàn cho tài khoản", description: "Không chia sẻ mật khẩu. Hãy đăng xuất sau khi sử dụng máy tính dùng chung.", color: "#f59e0b", background: "#fffbeb" },
];

function Introduction({ register, internal }) {
    return <Box sx={{
        position: "relative", overflow: "hidden", color: "white", p: { xs: 3, md: 4, lg: 5.5 },
        background: register ? "linear-gradient(145deg, #1976d2, #1675ca)" : "linear-gradient(145deg, #124da9, #006da7)",
        display: "flex", flexDirection: "column",
        "&::before": { content: '""', position: "absolute", width: 310, height: 310, borderRadius: "50%", bgcolor: "rgba(255,255,255,.045)", right: -130, top: -100 },
        "&::after": { content: '""', position: "absolute", width: 220, height: 220, borderRadius: "50%", bgcolor: "rgba(255,255,255,.045)", right: 35, bottom: 40, pointerEvents: "none" },
    }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: "flex-start", borderRadius: 10, px: 1.75, py: 0.8, bgcolor: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", mb: 3 }}>
            <ShieldOutlined sx={{ fontSize: 18, color: "#a5e6ff" }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>{internal ? "CỔNG NỘI BỘ MEDICLINIC" : "CỔNG DỊCH VỤ BỆNH NHÂN MEDICLINIC"}</Typography>
        </Stack>
        <Typography component="h1" sx={{ color: "#fff", fontSize: { xs: 27, lg: 34 }, lineHeight: 1.35, fontWeight: 750, letterSpacing: "-.025em", maxWidth: 440 }}>
            {register ? "Tạo tài khoản sức khỏe số MediClinic" : internal ? "Kết nối đội ngũ, chăm sóc tận tâm" : "Chăm sóc sức khỏe bắt đầu từ kết nối"}
        </Typography>
        <Typography sx={{ mt: 2, fontSize: 15, lineHeight: 1.75, color: "#daebff", maxWidth: 435 }}>
            {register ? "Đồng hành cùng bạn và gia đình. Tạo tài khoản để chủ động lựa chọn bác sĩ và đặt lịch khám phù hợp." : "Chào mừng bạn trở lại. Đăng nhập để kết nối với phòng khám và sắp xếp lịch khám thuận tiện hơn."}
        </Typography>
        <Stack spacing={3} sx={{ my: 4.5, display: { xs: "none", md: "flex" } }}>
            {FEATURES.map(({ icon: Icon, title, description }) => <Stack key={title} direction="row" spacing={1.75} alignItems="flex-start">
                <Box sx={{ p: 0.9, display: "flex", borderRadius: 1.5, bgcolor: "rgba(255,255,255,.12)", color: "#a2e7ff" }}><Icon sx={{ fontSize: 22 }} /></Box>
                <Box><Typography sx={{ fontSize: 16, fontWeight: 650, mb: 0.4 }}>{title}</Typography><Typography sx={{ fontSize: 14, lineHeight: 1.6, color: "#d1e5ff" }}>{description}</Typography></Box>
            </Stack>)}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: "auto", pt: 2.5, borderTop: "1px solid rgba(255,255,255,.18)", display: { xs: "none", md: "flex" }, color: "#d1e5ff" }}>
            <LockOutlined sx={{ fontSize: 18 }} /><Typography variant="body2">An tâm kết nối, chủ động chăm sóc sức khỏe.</Typography>
        </Stack>
    </Box>;
}

export default function AuthPage({ register = false, internal = false }) {
    const location = useLocation();
    return <Box sx={{ bgcolor: register ? "#f5f9fd" : "#f0f5fa", py: { xs: 3, md: 5.5 } }}>
        <Container maxWidth="xl">
            <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 17 }} />} sx={{ mb: { xs: 3, md: 4 }, fontSize: 14 }}>
                <Link component={RouterLink} to="/" underline="hover" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><HomeOutlined sx={{ fontSize: 17 }} />Trang chủ</Link>
                <Typography sx={{ fontSize: 14, display: { xs: "none", sm: "block" } }} color="text.secondary">{internal ? "Cổng nội bộ" : "Cổng dịch vụ bệnh nhân"}</Typography>
                <Typography color="primary" sx={{ fontSize: 14, fontWeight: 600 }}>{register ? "Đăng ký tài khoản" : "Đăng nhập"}</Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }, borderRadius: 2.5, overflow: "hidden", borderColor: "#e2e8f0", boxShadow: "0 2px 4px rgba(15,23,42,.03)" }}>
                <Introduction register={register} internal={internal} />
                <Box sx={{ p: { xs: 2.5, sm: 4, lg: 6 }, minWidth: 0 }}>
                    <Tabs value={register ? 1 : 0} aria-label="Đăng nhập hoặc đăng ký" sx={{ mb: { xs: 3, md: 4 }, borderBottom: "1px solid #e5e9f0", minHeight: 56, "& .MuiTab-root": { minHeight: 56, fontSize: { xs: 14, lg: 16 }, fontWeight: 650, px: { xs: 1.5, sm: 3 }, textTransform: "none", minWidth: 0 } }}>
                        <Tab component={RouterLink} to={internal ? "/internal/login" : "/login"} state={location.state} icon={<LoginOutlined sx={{ fontSize: 21 }} />} iconPosition="start" label="Đăng nhập" />
                        {!internal && <Tab component={RouterLink} to="/register" state={location.state} icon={<PersonAddAltOutlined sx={{ fontSize: 21 }} />} iconPosition="start" label="Đăng ký tài khoản" />}
                    </Tabs>
                    <Typography component="h2" sx={{ fontSize: { xs: 23, lg: 28 }, lineHeight: 1.35, fontWeight: 700, letterSpacing: "-.02em" }}>{register ? "Đăng ký tài khoản mới" : internal ? "Đăng nhập Cổng Nội Bộ" : "Đăng nhập Cổng Bệnh Nhân"}</Typography>
                    <Typography sx={{ mt: 1, mb: 3.5, fontSize: 14, lineHeight: 1.7 }} color="text.secondary">{register ? "Điền thông tin bên dưới để tạo tài khoản và bắt đầu đặt lịch khám trực tuyến." : "Sử dụng tên đăng nhập và mật khẩu bạn đã đăng ký với phòng khám."}</Typography>
                    <AuthForm key={register ? "register" : "login"} register={register} />
                    <Divider sx={{ my: 3.5 }} />
                    <Typography sx={{ fontSize: 14, textAlign: "center", lineHeight: 1.9 }} color="text.secondary">
                        {internal ? "Liên hệ quản trị viên để được cấp quyền truy cập nội bộ. " : register ? "Đã có tài khoản tại MediClinic? " : "Bạn chưa có tài khoản tại MediClinic? "}
                        <Link component={RouterLink} to={internal || register ? "/login" : "/register"} state={location.state} sx={{ fontWeight: 650, whiteSpace: "nowrap" }}>{internal ? "Cổng bệnh nhân" : register ? "Đăng nhập ngay" : "Đăng ký ngay"}</Link>
                    </Typography>
                </Box>
            </Paper>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, mt: 4, mb: { xs: 0, md: 2 } }}>
                {SUPPORT_CARDS.map(({ icon: Icon, title, description, color, background }) => <Paper key={title} variant="outlined" sx={{ p: { xs: 2.5, lg: 3 }, display: "flex", alignItems: "flex-start", gap: 2, borderRadius: 2, borderColor: "#e2e8f0" }}>
                    <Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: 1.5, color, bgcolor: background }}><Icon /></Box>
                    <Box><Typography sx={{ fontSize: 15, fontWeight: 650, mb: 0.75 }}>{title}</Typography><Typography sx={{ fontSize: 13, lineHeight: 1.7 }} color="text.secondary">{description}</Typography></Box>
                </Paper>)}
            </Box>
        </Container>
    </Box>;
}
