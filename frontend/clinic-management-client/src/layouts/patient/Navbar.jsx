import { useState } from "react";
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar, Typography } from "@mui/material";
import { AccountCircleOutlined, CalendarMonthOutlined, Close, LocalHospital, Menu, PhoneOutlined } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AccountMenu from "./AccountMenu";
import NotificationBell from "../../components/common/NotificationBell";
import { CLINIC } from "../../data/publicContent";

const NAV_LINKS = [
    ["Giới thiệu", "/about"], ["Chuyên khoa", "/specialties"], ["Bác sĩ", "/doctors"],
    ["Dịch vụ", "/services"], ["Bảng giá", "/pricing"], ["Hướng dẫn", "/health-guide"], ["Liên hệ", "/contact"],
];
const desktop = { display: "none", "@media (min-width: 1360px)": { display: "flex" } };

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
        : <Button component={Link} to="/login" onClick={close} variant="outlined" fullWidth={fullWidth} startIcon={<AccountCircleOutlined />}>Cổng Bệnh Nhân</Button>;
    return <>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", color: "text.primary", borderBottom: "1px solid #e5e9f0" }}>
            <Container maxWidth="xl"><Toolbar disableGutters sx={{ minHeight: { xs: 68, md: 80 }, gap: { xs: 0.5, sm: 2 } }}>
                <Box component={Link} to="/" aria-label="Clinic Management System – Trang chủ" onClick={close} sx={{ display: "flex", gap: 1.25, alignItems: "center", textDecoration: "none", color: "primary.main", flexShrink: 0 }}>
                    <Box sx={{ width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 }, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "white", borderRadius: 2 }}><LocalHospital /></Box>
                    <Box><Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.3 }}>Clinic Management</Typography><Typography sx={{ fontWeight: 650, fontSize: 13, lineHeight: 1.3 }}>System</Typography></Box>
                </Box>
                <Stack component="nav" aria-label="Điều hướng chính" direction="row" spacing={0.25} sx={{ ...desktop, flex: 1, justifyContent: "center" }}>
                    {NAV_LINKS.map(([label, href]) => <Button key={href} component={Link} to={href} aria-current={active(href) ? "page" : undefined} sx={{ color: active(href) ? "primary.main" : "text.primary", bgcolor: active(href) ? "#eff6ff" : undefined, fontSize: 16, px: 1, minWidth: 0, whiteSpace: "nowrap", fontWeight: active(href) ? 750 : 550 }}>{label}</Button>)}
                </Stack>
                {isAuthenticated && <Box sx={{ ml: { xs: "auto", xl: 0 }, display: "flex" }}><NotificationBell /></Box>}
                <Stack direction="row" spacing={1.25} sx={desktop}>{account(false)}<Button component={Link} to="/booking" variant="contained" startIcon={<CalendarMonthOutlined />}>Đặt lịch khám</Button></Stack>
                <IconButton aria-label="Mở menu điều hướng" aria-expanded={open} aria-controls={open ? "patient-mobile-nav" : undefined} onClick={() => setOpen(true)} sx={{ ml: isAuthenticated ? 0 : "auto", "@media (min-width: 1360px)": { display: "none" } }}><Menu /></IconButton>
            </Toolbar></Container>
        </AppBar>
        <Drawer anchor="right" open={open} onClose={close} slotProps={{ paper: { sx: { width: 310, maxWidth: "100vw" } } }}>
            <Stack direction="row"   sx={{ justifyContent: "space-between", alignItems: "center",  p: 2  }}><Typography  sx={{ fontWeight: 750 }}>Điều hướng</Typography><IconButton aria-label="Đóng menu" onClick={close}><Close /></IconButton></Stack><Divider />
            <List id="patient-mobile-nav" component="nav" aria-label="Điều hướng trên điện thoại" sx={{ "& .MuiListItemText-primary": { fontSize: 18 } }}>
                <ListItemButton component={Link} to="/" onClick={close} selected={location.pathname === "/"}><ListItemText primary="Trang chủ" /></ListItemButton>
                {NAV_LINKS.map(([label, href]) => <ListItemButton key={href} component={Link} to={href} onClick={close} selected={active(href)} aria-current={active(href) ? "page" : undefined}><ListItemText primary={label} /></ListItemButton>)}
            </List><Divider />
            <Stack spacing={2} sx={{ p: 2 }}>{account(true)}<Button fullWidth component={Link} to="/booking" onClick={close} variant="contained" startIcon={<CalendarMonthOutlined />}>Đặt lịch khám</Button><Button component="a" href={CLINIC.phoneHref} startIcon={<PhoneOutlined />}>{CLINIC.phone}</Button></Stack>
        </Drawer>
    </>;
}
