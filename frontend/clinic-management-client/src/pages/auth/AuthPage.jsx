import { Box, Breadcrumbs, Container, Divider, Link, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import {
    BadgeOutlined,
    CalendarMonthOutlined,
    CheckCircleOutlined,
    ChevronRight,
    HomeOutlined,
    LockOutlined,
    LoginOutlined,
    PersonAddAltOutlined,
    PersonOutlined,
    PhoneOutlined,
    ShieldOutlined,
} from "@mui/icons-material";
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
    return (
        <Box
            sx={{
                position: "relative",
                overflow: "hidden",
                color: "white",
                p: { xs: 3, md: 4.5, lg: 5.5 },
                background: register
                    ? "linear-gradient(145deg, #0f4c81 0%, #1976d2 100%)"
                    : "linear-gradient(145deg, #0c3d69 0%, #1565c0 100%)",
                display: "flex",
                flexDirection: "column",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,.05)",
                    right: -120,
                    top: -100,
                    pointerEvents: "none",
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,.04)",
                    right: 40,
                    bottom: 30,
                    pointerEvents: "none",
                },
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: "center",
                    alignSelf: "flex-start",
                    borderRadius: 10,
                    px: 1.75,
                    py: 0.75,
                    bgcolor: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.25)",
                    mb: 3,
                }}
            >
                <ShieldOutlined sx={{ fontSize: 18, color: "#a5e6ff" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>
                    {internal ? "CỔNG NỘI BỘ PHÒNG KHÁM" : "CỔNG DỊCH VỤ BỆNH NHÂN"}
                </Typography>
            </Stack>

            <Typography
                component="h1"
                sx={{
                    color: "#fff",
                    fontSize: { xs: 26, lg: 32 },
                    lineHeight: 1.35,
                    fontWeight: 800,
                    letterSpacing: "-.02em",
                    maxWidth: 440,
                }}
            >
                {register
                    ? "Tạo tài khoản sức khỏe số tiện lợi"
                    : internal
                    ? "Kết nối đội ngũ y tế, chăm sóc tận tâm"
                    : "Chăm sóc sức khỏe bắt đầu từ kết nối"}
            </Typography>

            <Typography sx={{ mt: 2, fontSize: 14.5, lineHeight: 1.75, color: "#dbeafe", maxWidth: 440 }}>
                {register
                    ? "Đồng hành cùng bạn và gia đình. Tạo tài khoản để chủ động lựa chọn bác sĩ và sắp xếp lịch khám phù hợp."
                    : "Chào mừng bạn trở lại. Đăng nhập để kết nối với phòng khám và quản lý lịch hẹn thuận tiện hơn."}
            </Typography>

            <Stack spacing={2.5} sx={{ my: 4, display: { xs: "none", md: "flex" } }}>
                {FEATURES.map(({ icon: Icon, title, description }) => (
                    <Stack key={title} direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                        <Box
                            sx={{
                                p: 1,
                                display: "flex",
                                borderRadius: "10px",
                                bgcolor: "rgba(255,255,255,.12)",
                                color: "#93c5fd",
                                flexShrink: 0,
                            }}
                        >
                            <Icon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.3, color: "#ffffff" }}>
                                {title}
                            </Typography>
                            <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "#bfdbfe" }}>
                                {description}
                            </Typography>
                        </Box>
                    </Stack>
                ))}
            </Stack>

            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: "center",
                    mt: "auto",
                    pt: 2.5,
                    borderTop: "1px solid rgba(255,255,255,.18)",
                    display: { xs: "none", md: "flex" },
                    color: "#dbeafe",
                }}
            >
                <LockOutlined sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                    An tâm kết nối, thông tin được bảo mật chuẩn mực y tế.
                </Typography>
            </Stack>
        </Box>
    );
}

export default function AuthPage({ register = false, internal = false }) {
    const location = useLocation();

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "85vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="xl">
                {/* Breadcrumbs */}
                <Breadcrumbs
                    separator={<ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />}
                    sx={{ mb: { xs: 2.5, md: 3.5 }, fontSize: 13.5 }}
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="hover"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                        <HomeOutlined sx={{ fontSize: 16 }} />
                        Trang chủ
                    </Link>
                    <Typography sx={{ fontSize: 13.5, display: { xs: "none", sm: "block" } }} color="text.secondary">
                        {internal ? "Cổng nội bộ" : "Cổng dịch vụ bệnh nhân"}
                    </Typography>
                    <Typography color="primary.main" sx={{ fontSize: 13.5, fontWeight: 650 }}>
                        {register ? "Đăng ký tài khoản" : "Đăng nhập"}
                    </Typography>
                </Breadcrumbs>

                {/* Main Auth Container */}
                <Paper
                    variant="outlined"
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
                        borderRadius: "18px",
                        overflow: "hidden",
                        borderColor: "#e2e8f0",
                        bgcolor: "#ffffff",
                        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
                    }}
                >
                    <Introduction register={register} internal={internal} />

                    <Box sx={{ p: { xs: 3, sm: 4.5, lg: 6 }, minWidth: 0 }}>
                        <Tabs
                            value={register ? 1 : 0}
                            aria-label="Đăng nhập hoặc đăng ký"
                            sx={{
                                mb: { xs: 3, md: 4 },
                                borderBottom: "1px solid #e5e9f0",
                                minHeight: 52,
                                "& .MuiTab-root": {
                                    minHeight: 52,
                                    fontSize: { xs: 14, sm: 15 },
                                    fontWeight: 700,
                                    px: { xs: 1.5, sm: 2.5 },
                                    textTransform: "none",
                                },
                            }}
                        >
                            <Tab
                                component={RouterLink}
                                to={internal ? "/internal/login" : "/login"}
                                state={location.state}
                                icon={<LoginOutlined sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label="Đăng nhập"
                            />
                            {!internal && (
                                <Tab
                                    component={RouterLink}
                                    to="/register"
                                    state={location.state}
                                    icon={<PersonAddAltOutlined sx={{ fontSize: 20 }} />}
                                    iconPosition="start"
                                    label="Đăng ký tài khoản"
                                />
                            )}
                        </Tabs>

                        <Typography
                            component="h2"
                            sx={{
                                fontSize: { xs: 22, lg: 26 },
                                lineHeight: 1.3,
                                fontWeight: 800,
                                color: "#0f2c4d",
                                letterSpacing: "-.02em",
                            }}
                        >
                            {register
                                ? "Đăng ký tài khoản mới"
                                : internal
                                ? "Đăng nhập Cổng Nội Bộ"
                                : "Đăng nhập Cổng Bệnh Nhân"}
                        </Typography>

                        <Typography sx={{ mt: 1, mb: 3.5, fontSize: 14, lineHeight: 1.6 }} color="text.secondary">
                            {register
                                ? "Điền thông tin bên dưới để tạo tài khoản và bắt đầu đặt lịch khám trực tuyến."
                                : "Sử dụng tên đăng nhập và mật khẩu bạn đã đăng ký với phòng khám."}
                        </Typography>

                        <AuthForm key={register ? "register" : "login"} register={register} />

                        <Divider sx={{ my: 3.5, borderColor: "#e5e9f0" }} />

                        <Typography sx={{ fontSize: 14, textAlign: "center", lineHeight: 1.8 }} color="text.secondary">
                            {internal
                                ? "Liên hệ quản trị viên để được cấp quyền truy cập nội bộ. "
                                : register
                                ? "Đã có tài khoản tại phòng khám? "
                                : "Bạn chưa có tài khoản? "}
                            <Link
                                component={RouterLink}
                                to={internal || register ? "/login" : "/register"}
                                state={location.state}
                                sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                            >
                                {internal ? "Cổng bệnh nhân" : register ? "Đăng nhập ngay" : "Đăng ký ngay"}
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

                {/* Support Cards */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                        gap: 2.5,
                        mt: 4,
                    }}
                >
                    {SUPPORT_CARDS.map(({ icon: Icon, title, description, color, background }) => (
                        <Paper
                            key={title}
                            variant="outlined"
                            sx={{
                                p: 2.5,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 2,
                                borderRadius: "14px",
                                borderColor: "#e2e8f0",
                                bgcolor: "#ffffff",
                                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                    borderRadius: "10px",
                                    color,
                                    bgcolor: background,
                                }}
                            >
                                <Icon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: 14.5, fontWeight: 700, mb: 0.5, color: "#1f2937" }}>
                                    {title}
                                </Typography>
                                <Typography sx={{ fontSize: 13, lineHeight: 1.6 }} color="text.secondary">
                                    {description}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}
