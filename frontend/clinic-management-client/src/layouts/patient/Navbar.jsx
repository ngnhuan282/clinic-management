// src/layouts/patient/Navbar.jsx

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
    ListItem,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const NAV_LINKS = [
    { label: "Trang chủ", href: "/" },
    { label: "Chuyên khoa", href: "/specialties" },
    { label: "Đội ngũ bác sĩ", href: "/doctors" },
    { label: "Dịch vụ y tế", href: "/services" },
    { label: "Bảng giá viện phí", href: "/pricing" },
    { label: "Cẩm nang sức khỏe", href: "/health-guide" },
];

const COLORS = {
    primary: "#005dac",
    primaryDark: "#004a8f",
    primaryLight: "#eff6ff",
    primaryBorder: "#bfdbfe",
    textHeading: "#1f2937",
    textMuted: "#6b7280",
    borderSubtle: "#e5e9f0",
};

const NAVBAR_STYLES = {
    appBar: {
        backgroundColor: "#ffffff",
        color: COLORS.textHeading,
        boxShadow: `0 1px 0 0 ${COLORS.borderSubtle}`,
        position: "sticky",
        top: 0,
        zIndex: 1100,
    },
    toolbar: {
        gap: 1.5,
        py: 0,
        minHeight: { xs: "64px", md: "78px" },
        alignItems: "center",
    },
    logoLink: {
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        textDecoration: "none",
        flexShrink: 0,
        py: 1,
    },
    logoIconBox: {
        width: 42,
        height: 42,
        backgroundColor: COLORS.primary,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
    },
    navLinksStack: {
        flexGrow: 1,
        display: "none",
        "@media (min-width: 1360px)": { display: "flex" },
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
    },
    navLinkBase: {
        fontSize: "14px",
        fontWeight: 500,
        color: COLORS.textHeading,
        px: 1,
        py: 1,
        borderRadius: "0px",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        minWidth: 0,
        flexShrink: 0,
        textAlign: "center",
        "&:hover": {
            backgroundColor: COLORS.primaryLight,
            color: COLORS.primary,
            borderRadius: "6px",
        },
    },
    navLinkActive: {
        color: COLORS.primary,
        fontWeight: 600,
        borderBottom: `2px solid ${COLORS.primary}`,
        "&:hover": {
            backgroundColor: "transparent",
        },
    },
    ctaStack: {
        display: { xs: "none", md: "flex" },
        flexDirection: "row",
        flexShrink: 0,
        ml: "auto",
        gap: 1,
        alignItems: "center",
        py: 1,
    },
    patientPortalBtn: {
        whiteSpace: "nowrap",
        fontWeight: 700,
        fontSize: "14px",
        color: COLORS.primary,
        border: `1.5px solid ${COLORS.primary}`,
        borderRadius: "8px",
        px: 2,
        py: 1,
        "&:hover": {
            backgroundColor: COLORS.primaryLight,
            border: `1.5px solid ${COLORS.primary}`,
        },
    },
    bookingBtn: {
        whiteSpace: "nowrap",
        fontWeight: 600,
        fontSize: "14px",
        backgroundColor: COLORS.primary,
        color: "#fff",
        borderRadius: "8px",
        px: 2.5,
        py: 1,
        boxShadow: "none",
        "&:hover": {
            backgroundColor: COLORS.primaryDark,
            boxShadow: "none",
        },
    },
    hotlinePill: {
        display: "none",
        "@media (min-width: 1600px)": { display: "flex" },
        whiteSpace: "nowrap",
        alignItems: "center",
        gap: 1,
        px: 1.75,
        py: 1,
        borderRadius: "999px",
        backgroundColor: "#f3f7fb",
        border: `1px solid ${COLORS.borderSubtle}`,
        color: COLORS.textHeading,
        fontWeight: 800,
        fontSize: "14px",
        lineHeight: 1.1,
    },
};

function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountAnchor, setAccountAnchor] = useState(null);
    const { isAuthenticated, user, role, logout } = useAuth();
    const navigate = useNavigate();
    const accountProps = isAuthenticated ? {
        component: "button",
        onClick: event => setAccountAnchor(event.currentTarget),
        "aria-haspopup": "menu",
        "aria-expanded": Boolean(accountAnchor),
    } : { component: "a", href: "/login" };

    async function handleLogout() {
        setAccountAnchor(null);
        setMobileOpen(false);
        try { await logout(); }
        catch { /* Local credentials are cleared even if the server is unavailable. */ }
        navigate("/login", { replace: true });
    }

    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    return (
        <>
            <AppBar sx={NAVBAR_STYLES.appBar} elevation={0}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={NAVBAR_STYLES.toolbar}>
                        {/* Logo */}
                        <Box component="a" href="/" sx={NAVBAR_STYLES.logoLink}>
                            <Box sx={NAVBAR_STYLES.logoIconBox}>
                                <LocalHospitalIcon sx={{ fontSize: "22px" }} />
                            </Box>
                            <Box sx={{ lineHeight: 1.1 }}>
                                <Typography
                                    noWrap
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: 800,
                                        color: COLORS.primary,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Clinic Management
                                </Typography>
                                <Typography
                                    noWrap
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: 800,
                                        color: COLORS.primary,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    System
                                </Typography>
                            </Box>
                        </Box>

                        {/* Navigation links — Desktop */}
                        <Stack sx={NAVBAR_STYLES.navLinksStack}>
                            {NAV_LINKS.map((link) => (
                                <Button
                                    key={link.href}
                                    component="a"
                                    href={link.href}
                                    sx={{
                                        ...NAVBAR_STYLES.navLinkBase,
                                    }}
                                >
                                    {link.label}
                                </Button>
                            ))}
                        </Stack>

                        {/* CTA buttons — Desktop */}
                        <Stack sx={NAVBAR_STYLES.ctaStack}>
                            <Box sx={NAVBAR_STYLES.hotlinePill}>
                                <LocalPhoneIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                                <Box>1900 6868</Box>
                            </Box>
                            <Button
                                variant="outlined"
                                {...accountProps}
                                startIcon={<AccountCircleIcon sx={{ fontSize: "18px" }} />}
                                sx={NAVBAR_STYLES.patientPortalBtn}
                            >
                                {isAuthenticated ? "Tài khoản" : "Cổng Bệnh Nhân"}
                            </Button>
                            <Button
                                variant="contained"
                                component="a"
                                href="/booking"
                                startIcon={<CalendarMonthIcon sx={{ fontSize: "18px" }} />}
                                sx={NAVBAR_STYLES.bookingBtn}
                            >
                                Đặt lịch khám
                            </Button>
                        </Stack>

                        {/* Mobile toggle */}
                        <IconButton
                            onClick={handleDrawerToggle}
                            sx={{
                                display: "inline-flex",
                                ml: { xs: "auto", md: 0 },
                                "@media (min-width: 1360px)": { display: "none" },
                            }}
                            aria-label="Mở menu điều hướng"
                        >
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                PaperProps={{ sx: { width: 280 } }}
            >
                <Box
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 800,
                            color: COLORS.primary,
                            fontSize: "17px",
                        }}
                    >
                        MedClinic
                    </Typography>
                    <IconButton onClick={handleDrawerToggle} aria-label="Đóng menu">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <List>
                    {NAV_LINKS.map((link) => (
                        <ListItem key={link.href} disablePadding>
                            <ListItemButton
                                component="a"
                                href={link.href}
                                sx={{
                                    ...(link.isActive
                                        ? { color: COLORS.primary, fontWeight: 700 }
                                        : {}),
                                }}
                            >
                                <ListItemText
                                    primary={link.label}
                                    primaryTypographyProps={{
                                        fontSize: "14px",
                                        fontWeight: link.isActive ? 700 : 500,
                                        color: link.isActive ? COLORS.primary : COLORS.textHeading,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        {...accountProps}
                        startIcon={<AccountCircleIcon />}
                        sx={{
                            ...NAVBAR_STYLES.patientPortalBtn,
                            justifyContent: "flex-start",
                        }}
                    >
                        {isAuthenticated ? "Tài khoản" : "Cổng Bệnh Nhân"}
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        component="a"
                        href="/booking"
                        startIcon={<CalendarMonthIcon />}
                        sx={{
                            ...NAVBAR_STYLES.bookingBtn,
                            justifyContent: "flex-start",
                        }}
                    >
                        Đặt lịch khám
                    </Button>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            pt: 1,
                            borderTop: `1px solid ${COLORS.borderSubtle}`,
                        }}
                    >
                        <LocalPhoneIcon sx={{ color: COLORS.primary, fontSize: "18px" }} />
                        <Typography
                            sx={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: COLORS.primary,
                            }}
                        >
                            Hotline: 1900 6868
                        </Typography>
                    </Box>
                </Box>
            </Drawer>
            <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
                <Box sx={{ px: 2, py: 1, maxWidth: 280 }}><Typography fontWeight={600}>{user?.fullName}</Typography></Box>
                <Divider />
                <MenuItem onClick={() => { setAccountAnchor(null); setMobileOpen(false); navigate(role === "Patient" ? "/booking" : "/internal/dashboard"); }}>
                    {role === "Patient" ? "Đặt lịch khám" : "Trang quản lý"}
                </MenuItem>
                <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
            </Menu>
        </>
    );
}

export default Navbar;
