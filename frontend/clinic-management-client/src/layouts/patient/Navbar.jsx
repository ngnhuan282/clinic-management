import { useState } from "react";
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar, Typography } from "@mui/material";
import { AccountCircleOutlined, CalendarMonthOutlined, Close, LocalHospital, Menu, PhoneOutlined } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AccountMenu from "./AccountMenu";
import NotificationBell from "../../components/common/NotificationBell";
import { CLINIC } from "../../data/publicContent";

const NAV_LINKS = [
    { label: "Giới thiệu", href: "/about" },
    { label: "Chuyên khoa", href: "/specialties" },
    { label: "Bác sĩ", href: "/doctors" },
    { label: "Dịch vụ", href: "/services" },
    { label: "Bảng giá", href: "/pricing" },
    { label: "Hướng dẫn", href: "/health-guide" },
    { label: "Liên hệ", href: "/contact" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { isAuthenticated, user, role, sessionChecked, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const active = href => location.pathname === href || location.pathname.startsWith(href + "/");
    const close = () => setOpen(false);
    const accountNavigate = path => { close(); navigate(path); };
    const handleLogout = async () => { close(); try { await logout(); } finally { navigate("/"); } };

    const account = fullWidth => isAuthenticated
        ? <AccountMenu key={user?.userId} user={user} role={role} sessionChecked={sessionChecked} fullWidth={fullWidth} onNavigate={accountNavigate} onLogout={handleLogout} />
        : <Button
            component={Link}
            to="/login"
            onClick={close}
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={<AccountCircleOutlined />}
            sx={{
                borderRadius: "10px",
                borderColor: "#cfe0ef",
                color: "primary.main",
                fontWeight: 600,
                textTransform: "none",
                minHeight: 42,
                px: 2,
                "&:hover": { borderColor: "primary.main", bgcolor: "#eff6ff" },
            }}
        >
            Cổng Bệnh Nhân
        </Button>;

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: "rgba(255, 255, 255, 0.96)",
                    backdropFilter: "blur(10px)",
                    color: "text.primary",
                    borderBottom: "1px solid #e5e9f0",
                    transition: "box-shadow 0.2s ease",
                    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 74 }, gap: { xs: 1, md: 2 } }}>
                        {/* Brand Logo */}
                        <Box
                            component={Link}
                            to="/"
                            aria-label="Clinic Management System – Trang chủ"
                            onClick={close}
                            sx={{
                                display: "flex",
                                gap: 1.5,
                                alignItems: "center",
                                textDecoration: "none",
                                color: "primary.main",
                                flexShrink: 0,
                                transition: "transform 0.15s ease",
                                "&:hover": { transform: "translateY(-1px)" },
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: 38, sm: 44 },
                                    height: { xs: 38, sm: 44 },
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: "primary.main",
                                    color: "white",
                                    borderRadius: "10px",
                                    boxShadow: "0 4px 10px rgba(25, 118, 210, 0.25)",
                                }}
                            >
                                <LocalHospital sx={{ fontSize: { xs: 22, sm: 26 } }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.25, color: "#0f2c4d" }}>
                                    Clinic Management
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.25, color: "primary.main", letterSpacing: "0.02em" }}>
                                    System
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
                                display: { xs: "none", lg: "flex" },
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
                                            color: isCurrent ? "primary.main" : "#374151",
                                            bgcolor: isCurrent ? "#eff6ff" : "transparent",
                                            fontSize: 14.5,
                                            px: 1.6,
                                            py: 0.8,
                                            borderRadius: "8px",
                                            minWidth: 0,
                                            whiteSpace: "nowrap",
                                            fontWeight: isCurrent ? 700 : 500,
                                            textTransform: "none",
                                            transition: "all 0.15s ease",
                                            border: isCurrent ? "1px solid #bfdbfe" : "1px solid transparent",
                                            "&:hover": {
                                                bgcolor: isCurrent ? "#e0f2fe" : "#f8fafc",
                                                color: "primary.main",
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
                            <Box sx={{ ml: { xs: "auto", lg: 0 }, display: "flex", alignItems: "center" }}>
                                <NotificationBell />
                            </Box>
                        )}

                        <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{
                                display: { xs: "none", lg: "flex" },
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
                                    minHeight: 42,
                                    px: 2.2,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.25)",
                                    "&:hover": {
                                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.35)",
                                    },
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
                                display: { xs: "flex", lg: "none" },
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
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
                            maxWidth: "85vw",
                            bgcolor: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                        },
                    },
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                        <Box
                            sx={{
                                width: 34,
                                height: 34,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "primary.main",
                                color: "white",
                                borderRadius: "8px",
                            }}
                        >
                            <LocalHospital sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 750, fontSize: 16 }}>Menu điều hướng</Typography>
                    </Box>
                    <IconButton aria-label="Đóng menu" onClick={close} size="small" sx={{ border: "1px solid #e5e9f0" }}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
                <Divider />

                <List id="patient-mobile-nav" component="nav" aria-label="Điều hướng trên điện thoại" sx={{ px: 1.5, py: 1.5, flex: 1, overflowY: "auto" }}>
                    <ListItemButton
                        component={Link}
                        to="/"
                        onClick={close}
                        selected={location.pathname === "/"}
                        sx={{
                            borderRadius: "8px",
                            mb: 0.5,
                            "&.Mui-selected": { bgcolor: "#eff6ff", color: "primary.main", fontWeight: 700 },
                        }}
                    >
                        <ListItemText primary="Trang chủ" primaryTypographyProps={{ fontSize: 15, fontWeight: location.pathname === "/" ? 700 : 500 }} />
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
                                    "&.Mui-selected": { bgcolor: "#eff6ff", color: "primary.main", fontWeight: 700 },
                                }}
                            >
                                <ListItemText primary={label} primaryTypographyProps={{ fontSize: 15, fontWeight: isCurrent ? 700 : 500 }} />
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider />

                <Stack spacing={1.5} sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
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
                            minHeight: 44,
                            fontWeight: 700,
                            textTransform: "none",
                        }}
                    >
                        Đặt lịch khám
                    </Button>
                    <Button
                        fullWidth
                        component="a"
                        href={CLINIC.phoneHref}
                        variant="outlined"
                        startIcon={<PhoneOutlined />}
                        sx={{
                            borderRadius: "10px",
                            minHeight: 42,
                            color: "text.primary",
                            borderColor: "#cbd5e1",
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        Hotline: {CLINIC.phone}
                    </Button>
                </Stack>
            </Drawer>
        </>
    );
}
