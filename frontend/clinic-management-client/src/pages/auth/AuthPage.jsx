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
import { useClinicInfo } from "../../api/publicApi";

const FEATURES = [
    {
        icon: BadgeOutlined,
        title: "Hồ sơ sức khỏe đồng bộ",
        description: "Lưu trữ thông tin cá nhân, lịch sử khám, đơn thuốc và xét nghiệm xuyên suốt.",
    },
    {
        icon: CalendarMonthOutlined,
        title: "Đặt lịch khám chủ động",
        description: "Tra cứu chuyên khoa, bác sĩ và khung giờ trống theo thời gian thực.",
    },
    {
        icon: CheckCircleOutlined,
        title: "Tiếp nhận thuận tiện tại quầy",
        description: "Nhận thông báo trạng thái lịch hẹn và rút ngắn thời gian làm thủ tục.",
    },
    {
        icon: ShieldOutlined,
        title: "Bảo mật chuẩn mực y tế",
        description: "Dữ liệu bệnh án điện tử được phân quyền nghiêm ngặt cho riêng bạn.",
    },
];

const SUPPORT_CARDS = [
    {
        icon: PersonOutlined,
        title: "Tài khoản dành cho bệnh nhân",
        description: "Đăng ký miễn phí một lần để quản lý lịch hẹn và kết quả cận lâm sàng lâu dài.",
        color: "#0B4F8A",
        background: "#E6F0FA",
    },
    {
        icon: PhoneOutlined,
        title: "Thông tin liên hệ chính xác",
        description: "Số điện thoại giúp lễ tân xác nhận lịch khám và thông báo thay đổi kịp thời.",
        color: "#0B4F8A",
        background: "#E6F0FA",
    },
    {
        icon: LockOutlined,
        title: "An toàn thông tin y tế",
        description: "Không chia sẻ mật khẩu và nhớ đăng xuất khi dùng thiết bị công cộng.",
        color: "#92400E",
        background: "#FFFBEB",
    },
];

function Introduction({ register, internal }) {
    const clinic = useClinicInfo();
    return (
        <Box
            sx={{
                color: "#FFFFFF",
                p: { xs: 3, md: 4.5, lg: 5.5 },
                bgcolor: "#0B3B68",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: "center",
                    alignSelf: "flex-start",
                    borderRadius: "8px",
                    px: 1.5,
                    py: 0.65,
                    bgcolor: "#0F528C",
                    border: "1px solid rgba(255,255,255,.28)",
                    mb: 3,
                }}
            >
                <ShieldOutlined sx={{ fontSize: 18, color: "#BAE6FD" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 750, letterSpacing: ".04em", color: "#FFFFFF" }}>
                    {clinic.name} · {internal ? "CỔNG NỘI BỘ" : "CỔNG BỆNH NHÂN"}
                </Typography>
            </Stack>

            <Typography
                component="h1"
                sx={{
                    color: "#FFFFFF",
                    fontSize: { xs: 26, lg: 32 },
                    lineHeight: 1.32,
                    fontWeight: 800,
                    letterSpacing: "-.015em",
                    maxWidth: 440,
                }}
            >
                {register
                    ? "Tạo tài khoản sức khỏe số tiện lợi"
                    : internal
                        ? "Kết nối đội ngũ y tế, chăm sóc tận tâm"
                        : "Chăm sóc sức khỏe bắt đầu từ kết nối"}
            </Typography>

            <Typography sx={{ mt: 2, fontSize: 15, lineHeight: 1.75, color: "#E6F0FA", maxWidth: 440 }}>
                {register
                    ? "Đồng hành cùng bạn và gia đình trong từng buổi thăm khám. Chủ động chọn bác sĩ, khung giờ và theo dõi hồ sơ bệnh án mọi lúc."
                    : "Chào mừng bạn trở lại. Đăng nhập để quản lý lịch hẹn, kết quả xét nghiệm và hồ sơ y tế thuận tiện hơn."}
            </Typography>

            <Stack spacing={2.5} sx={{ my: 4, display: { xs: "none", md: "flex" } }}>
                {FEATURES.map(({ icon: Icon, title, description }) => (
                    <Stack key={title} direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                        <Box
                            sx={{
                                p: 1.1,
                                display: "flex",
                                borderRadius: "10px",
                                bgcolor: "#0F528C",
                                color: "#BAE6FD",
                                flexShrink: 0,
                            }}
                        >
                            <Icon sx={{ fontSize: 21 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 15.5, fontWeight: 750, mb: 0.3, color: "#FFFFFF" }}>
                                {title}
                            </Typography>
                            <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: "#DCEBFA" }}>
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
                    borderTop: "1px solid rgba(255,255,255,.22)",
                    display: { xs: "none", md: "flex" },
                    color: "#E6F0FA",
                }}
            >
                <LockOutlined sx={{ fontSize: 18, color: "#BAE6FD" }} />
                <Typography variant="body2" sx={{ fontSize: 13.5, color: "#E6F0FA" }}>
                    An tâm kết nối — thông tin y tế cá nhân luôn được bảo vệ nghiêm ngặt.
                </Typography>
            </Stack>
        </Box>
    );
}

export default function AuthPage({ register = false, internal = false }) {
    const location = useLocation();

    return (
        <Box sx={{ bgcolor: "#F4F7FA", minHeight: "85vh", py: { xs: 3, md: 5 } }}>
            <Container maxWidth="lg">
                {/* Breadcrumbs */}
                <Breadcrumbs
                    separator={<ChevronRight sx={{ fontSize: 16, color: "#64748B" }} />}
                    sx={{ mb: { xs: 2.5, md: 3 }, fontSize: 14 }}
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="hover"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                        <HomeOutlined sx={{ fontSize: 17 }} />
                        Trang chủ
                    </Link>
                    <Typography sx={{ fontSize: 14, display: { xs: "none", sm: "block" } }} color="text.secondary">
                        {internal ? "Cổng nội bộ" : "Cổng dịch vụ bệnh nhân"}
                    </Typography>
                    <Typography color="primary.main" sx={{ fontSize: 14, fontWeight: 750 }}>
                        {register ? "Đăng ký tài khoản" : "Đăng nhập"}
                    </Typography>
                </Breadcrumbs>

                {/* Main Auth Container */}
                <Paper
                    variant="outlined"
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
                        borderRadius: "16px",
                        overflow: "hidden",
                        borderColor: "#C5D8EC",
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 6px 24px rgba(10, 37, 64, 0.06)",
                    }}
                >
                    <Introduction register={register} internal={internal} />

                    <Box sx={{ p: { xs: 3, sm: 4.5, lg: 5.5 }, minWidth: 0 }}>
                        <Tabs
                            value={register ? 1 : 0}
                            aria-label="Đăng nhập hoặc đăng ký"
                            sx={{
                                mb: { xs: 3, md: 3.5 },
                                borderBottom: "1px solid #DCE7F2",
                                minHeight: 52,
                                "& .MuiTab-root": {
                                    minHeight: 52,
                                    fontSize: { xs: 14.5, sm: 15.5 },
                                    fontWeight: 750,
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
                                color: "#0A2540",
                                letterSpacing: "-.015em",
                            }}
                        >
                            {register
                                ? "Đăng ký tài khoản mới"
                                : internal
                                    ? "Đăng nhập Cổng Nội Bộ"
                                    : "Đăng nhập Cổng Bệnh Nhân"}
                        </Typography>

                        <Typography sx={{ mt: 1, mb: 3.25, fontSize: 14.5, lineHeight: 1.65 }} color="text.secondary">
                            {register
                                ? "Điền thông tin bên dưới để tạo tài khoản bệnh nhân và bắt đầu đặt lịch khám trực tuyến."
                                : "Sử dụng tên đăng nhập và mật khẩu bạn đã đăng ký với phòng khám."}
                        </Typography>

                        <AuthForm key={register ? "register" : "login"} register={register} />

                        <Divider sx={{ my: 3.25, borderColor: "#DCE7F2" }} />

                        <Typography sx={{ fontSize: 14.5, textAlign: "center", lineHeight: 1.8 }} color="text.secondary">
                            {internal
                                ? "Liên hệ quản trị viên để được cấp quyền truy cập nội bộ. "
                                : register
                                    ? "Đã có tài khoản tại phòng khám? "
                                    : "Bạn chưa có tài khoản? "}
                            <Link
                                component={RouterLink}
                                to={internal || register ? "/login" : "/register"}
                                state={location.state}
                                sx={{ fontWeight: 750, whiteSpace: "nowrap" }}
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
                        mt: 3.5,
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
                                gap: 1.75,
                                borderRadius: "14px",
                                borderColor: "#CEDCEB",
                                bgcolor: "#FFFFFF",
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
                                <Typography sx={{ fontSize: 15, fontWeight: 750, mb: 0.4, color: "#0A2540" }}>
                                    {title}
                                </Typography>
                                <Typography sx={{ fontSize: 13.5, lineHeight: 1.65 }} color="text.secondary">
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
