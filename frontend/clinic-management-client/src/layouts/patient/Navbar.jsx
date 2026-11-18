import { useState } from "react";
import {
    AppBar,
    Box,
    Button,
    Container,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    AccountCircleOutlined,
    CalendarMonthOutlined,
    Close,
    HealthAndSafetyOutlined,
    LocalHospital,
    Menu,
    PhoneInTalkOutlined,
    PhoneOutlined,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AccountMenu from "./AccountMenu";
import NotificationBell from "../../components/common/NotificationBell";
import { useClinicInfo } from "../../api/publicApi";

const NAV_LINKS = [
    { label: "Giới thiệu", href: "/about" },
    { label: "Chuyên khoa", href: "/specialties" },
    { label: "Bác sĩ", href: "/doctors" },
    { label: "Dịch vụ", href: "/services" },
    { label: "Bảng giá", href: "/pricing" },
    { label: "Hướng dẫn", href: "/health-guide" },
    { label: "Liên hệ", href: "/contact" },
];

const DESKTOP_NAV_QUERY = "@media (min-width: 1360px)";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { isAuthenticated, user, role, sessionChecked, logout } = useAuth();
    const clinic = useClinicInfo();
    const location = useLocation();
    const navigate = useNavigate();

    const active = href => location.pathname === href || location.pathname.startsWith(href + "/");
    const close = () => setOpen(false);
    const accountNavigate = path => {
        close();
        navigate(path);
    };
    const handleLogout = async () => {
        close();
        try {
            await logout();
        } finally {
            navigate("/");
        }
    };

    const account = fullWidth =>
        isAuthenticated ? (
            <AccountMenu
                key={user?.userId}
                user={user}
                role={role}
                sessionChecked={sessionChecked}
                fullWidth={fullWidth}
                onNavigate={accountNavigate}
                onLogout={handleLogout}
            />
        ) : (
            <Button
                component={Link}
                to="/login"
                onClick={close}
                variant="outlined"
                fullWidth={fullWidth}
                startIcon={<AccountCircleOutlined />}
                sx={{
                    borderRadius: "10px",
                    borderColor: "#B8CCE0",
                    bgcolor: "#FFFFFF",
                    color: "primary.main",
                    fontWeight: 700,
                    textTransform: "none",
                    minHeight: 44,
                    px: 2,
                    "&:hover": { borderColor: "primary.main", bgcolor: "#E6F0FA" },
                }}
            >
                Cổng Bệnh Nhân
            </Button>
        );

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: "#FFFFFF",
                    color: "text.primary",
                    borderBottom: "1px solid #CEDCEB",
                    boxShadow: "0 2px 8px rgba(10, 37, 64, 0.05)",
                }}
            >
                {/* Solid Deep-Blue Clinical Info Strip (Desktop) */}
                <Box
                    sx={{
                        display: { xs: "none", md: "block" },
                        bgcolor: "#0B3B68",
                        color: "#FFFFFF",
                        py: 0.75,
                        fontSize: 13,
                    }}
                >
                    <Container maxWidth="xl">
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", minWidth: 0 }}>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                    <HealthAndSafetyOutlined sx={{ fontSize: 16, color: "#BAE6FD" }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 650, color: "#FFFFFF" }}>
                                        Đặt lịch trực tuyến miễn phí · Tiếp nhận chu đáo
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", display: { md: "none", lg: "flex" } }}>
                                    <AccessTimeOutlined sx={{ fontSize: 15, color: "#BAE6FD" }} />
                                    <Typography sx={{ fontSize: 13, color: "#E6F0FA" }}>
                                        Giờ tiếp nhận: {clinic.hours}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Box
                                component="a"
                                href={clinic.phoneHref}
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontWeight: 750,
                                    fontSize: 13,
                                    px: 1.5,
                                    py: 0.3,
                                    borderRadius: "8px",
                                    bgcolor: "#0F528C",
                                    border: "1px solid rgba(255, 255, 255, 0.25)",
                                    "&:hover": { bgcolor: "#1565C0" },
                                }}
                            >
                                <PhoneInTalkOutlined sx={{ fontSize: 15 }} />
                                Tổng đài hỗ trợ: {clinic.phone}
                            </Box>
                        </Stack>
                    </Container>
                </Box>

                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ minHeight: { xs: 66, md: 74 }, gap: { xs: 1, md: 1.5 } }}>
                        {/* Brand Logo */}
                        <Box
                            component={Link}
                            to="/"
                            aria-label={`${clinic.name} – Trang chủ`}
                            onClick={close}
                            sx={{
                                display: "flex",
                                gap: 1.35,
                                alignItems: "center",
                                textDecoration: "none",
                                color: "primary.main",
                                minWidth: 0,
                                maxWidth: { xs: 205, sm: 255 },
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: 40, sm: 44 },
                                    height: { xs: 40, sm: 44 },
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: "#0B4F8A",
                                    color: "#FFFFFF",
                                    borderRadius: "10px",
                                    flexShrink: 0,
                                }}
                            >
                                <LocalHospital sx={{ fontSize: { xs: 22, sm: 25 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    noWrap
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: 15, sm: 16.5 },
                                        lineHeight: 1.25,
                                        color: "#0A2540",
                                    }}
                                >
                                    {clinic.name}
                                </Typography>
                                <Typography
                                    noWrap
                                    sx={{
                                        fontWeight: 650,
                                        fontSize: 12,
                                        lineHeight: 1.25,
                                        color: "#0B4F8A",
                                    }}
                                >
                                    {clinic.tagline}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Desktop Navigation */}
                        <Stack
                            component="nav"
                            aria-label="Điều hướng chính"
                            direction="row"
                            spacing={0.5}
                            sx={{
                                display: "none",
                                [DESKTOP_NAV_QUERY]: { display: "flex" },
                                flex: 1,
                                justifyContent: "center",
                                px: 1,
                            }}
                        >
                            {NAV_LINKS.map(({ label, href }) => {
                                const isCurrent = active(href);
                                return (
                                    <Button
                                        key={href}
                                        component={Link}
                                        to={href}
                                        aria-current={isCurrent ? "page" : undefined}
                                        sx={{
                                            color: isCurrent ? "#0B4F8A" : "#1E293B",
                                            bgcolor: isCurrent ? "#E6F0FA" : "transparent",
                                            fontSize: 14.5,
                                            px: 1.6,
                                            py: 0.8,
                                            borderRadius: "8px",
                                            minWidth: 0,
                                            minHeight: 40,
                                            whiteSpace: "nowrap",
                                            fontWeight: isCurrent ? 750 : 600,
                                            textTransform: "none",
                                            border: isCurrent ? "1px solid #90BCE6" : "1px solid transparent",
                                            "&:hover": {
                                                bgcolor: "#E6F0FA",
                                                color: "#0B4F8A",
                                            },
                                        }}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </Stack>

                        {/* Right Actions */}
                        {isAuthenticated && (
                            <Box sx={{ ml: "auto", [DESKTOP_NAV_QUERY]: { ml: 0 }, display: "flex", alignItems: "center" }}>
                                <NotificationBell />
                            </Box>
                        )}

                        <Stack
                            direction="row"
                            spacing={1.25}
                            sx={{
                                display: "none",
                                [DESKTOP_NAV_QUERY]: { display: "flex" },
                                alignItems: "center",
                                ml: isAuthenticated ? 0 : "auto",
                            }}
                        >
                            {account(false)}
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    minHeight: 44,
                                    px: 2.25,
                                    fontWeight: 750,
                                    textTransform: "none",
                                    whiteSpace: "nowrap",
                                    bgcolor: "#0B4F8A",
                                    "&:hover": { bgcolor: "#083A66" },
                                }}
                            >
                                Đặt lịch khám
                            </Button>
                        </Stack>

                        {/* Mobile Hamburger Button */}
                        <IconButton
                            aria-label="Mở menu điều hướng"
                            aria-expanded={open}
                            aria-controls={open ? "patient-mobile-nav" : undefined}
                            onClick={() => setOpen(true)}
                            sx={{
                                ml: isAuthenticated ? 0 : "auto",
                                display: "flex",
                                [DESKTOP_NAV_QUERY]: { display: "none" },
                                border: "1px solid #B8CCE0",
                                bgcolor: "#F4F8FC",
                                color: "#0A2540",
                                borderRadius: "10px",
                                p: 1,
                            }}
                        >
                            <Menu />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="right"
                open={open}
                onClose={close}
                slotProps={{
                    paper: {
                        sx: {
                            width: 320,
                            maxWidth: "88vw",
                            bgcolor: "#FFFFFF",
                            display: "flex",
                            flexDirection: "column",
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2.25,
                        bgcolor: "#EAF2FA",
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "#0B4F8A",
                                color: "#FFFFFF",
                                borderRadius: "8px",
                            }}
                        >
                            <LocalHospital sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#0A2540", lineHeight: 1.2 }}>
                                Menu điều hướng
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#0B4F8A", fontWeight: 650 }}>
                                Cổng thông tin y tế
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        aria-label="Đóng menu"
                        onClick={close}
                        size="small"
                        sx={{ border: "1px solid #B8CCE0", bgcolor: "#FFFFFF", color: "#0A2540" }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
                <Divider />

                <List
                    id="patient-mobile-nav"
                    component="nav"
                    aria-label="Điều hướng trên điện thoại"
                    sx={{ px: 1.5, py: 1.5, flex: 1, overflowY: "auto" }}
                >
                    <ListItemButton
                        component={Link}
                        to="/"
                        onClick={close}
                        selected={location.pathname === "/"}
                        sx={{
                            borderRadius: "8px",
                            mb: 0.5,
                            minHeight: 46,
                            "&.Mui-selected": { bgcolor: "#E6F0FA", color: "#0B4F8A", fontWeight: 750 },
                        }}
                    >
                        <ListItemText
                            primary="Trang chủ"
                            primaryTypographyProps={{ fontSize: 15.5, fontWeight: location.pathname === "/" ? 750 : 600 }}
                        />
                    </ListItemButton>
                    {NAV_LINKS.map(({ label, href }) => {
                        const isCurrent = active(href);
                        return (
                            <ListItemButton
                                key={href}
                                component={Link}
                                to={href}
                                onClick={close}
                                selected={isCurrent}
                                aria-current={isCurrent ? "page" : undefined}
                                sx={{
                                    borderRadius: "8px",
                                    mb: 0.5,
                                    minHeight: 46,
                                    "&.Mui-selected": { bgcolor: "#E6F0FA", color: "#0B4F8A", fontWeight: 750 },
                                }}
                            >
                                <ListItemText
                                    primary={label}
                                    primaryTypographyProps={{ fontSize: 15.5, fontWeight: isCurrent ? 750 : 600 }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider />

                <Stack spacing={1.25} sx={{ p: 2.25, bgcolor: "#F4F7FA" }}>
                    {account(true)}
                    <Button
                        fullWidth
                        component={Link}
                        to="/booking"
                        onClick={close}
                        variant="contained"
                        startIcon={<CalendarMonthOutlined />}
                        sx={{
                            borderRadius: "10px",
                            minHeight: 46,
                            fontWeight: 750,
                            textTransform: "none",
                            bgcolor: "#0B4F8A",
                            "&:hover": { bgcolor: "#083A66" },
                        }}
                    >
                        Đặt lịch khám
                    </Button>
                    <Button
                        fullWidth
                        component="a"
                        href={clinic.phoneHref}
                        variant="outlined"
                        startIcon={<PhoneOutlined />}
                        sx={{
                            borderRadius: "10px",
                            minHeight: 44,
                            color: "#0A2540",
                            bgcolor: "#FFFFFF",
                            borderColor: "#B8CCE0",
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        Hotline: {clinic.phone}
                    </Button>
                </Stack>
            </Drawer>
        </>
    );
}
