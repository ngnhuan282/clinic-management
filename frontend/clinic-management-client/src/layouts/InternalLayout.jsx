import { useState } from "react";
import { Avatar, Box, Button, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import { LocalHospitalOutlined, LogoutOutlined, MenuOutlined } from "@mui/icons-material";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { INTERNAL_PAGES, ROLE_LABELS } from "../routes/roleAccess";

export default function InternalLayout() {
    const { user, role, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const pages = INTERNAL_PAGES.filter(page => page.roles.includes(role));
    async function handleLogout() {
        setLoggingOut(true);
        try { await logout(); }
        catch { /* Local credentials are always removed. */ }
        finally { navigate("/internal/login", { replace: true }); }
    }
    const navigation = <Stack sx={{ height: "100%" }}>
        <Stack component={Link} to="/internal/dashboard" direction="row" spacing={1.5} sx={{ alignItems: "center", p: 3, color: "primary.main", textDecoration: "none" }}>
            <LocalHospitalOutlined fontSize="large" />
            <Box><Typography sx={{ fontWeight: 800 }}>MediClinic</Typography><Typography variant="caption" color="text.secondary">Cổng quản lý nội bộ</Typography></Box>
        </Stack>
        <Divider />
        <Typography variant="overline" color="text.secondary" sx={{ px: 3, pt: 3 }}>Không gian làm việc</Typography>
        <List component="nav" aria-label="Điều hướng nội bộ" sx={{ px: 1.5 }}>
            {pages.map(page => <ListItemButton key={page.path} component={Link} to={page.path}
                selected={pathname === page.path || pathname.startsWith(`${page.path}/`)}
                onClick={() => setMobileOpen(false)} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <ListItemText primary={page.label} />
            </ListItemButton>)}
        </List>
        <Box sx={{ mt: "auto", p: 3 }}><Chip size="small" label={ROLE_LABELS[role]} color="primary" variant="outlined" />
            <Button component={Link} to="/" fullWidth sx={{ mt: 2 }}>Trang chủ phòng khám</Button>
        </Box>
    </Stack>;
    return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Box component="aside" sx={{ width: 260, flexShrink: 0, display: { xs: "none", lg: "block" }, bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", height: "100vh", position: "sticky", top: 0 }}>{navigation}</Box>
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ "& .MuiDrawer-paper": { width: 280 } }}>{navigation}</Drawer>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack component="header" direction="row" spacing={2} sx={{ alignItems: "center", minHeight: 80, px: { xs: 2, md: 4 }, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                <IconButton aria-label="Mở menu" onClick={() => setMobileOpen(true)} sx={{ display: { lg: "none" } }}><MenuOutlined /></IconButton>
                <Typography sx={{ flex: 1, display: { xs: "none", sm: "block" }, fontWeight: 600 }}>Quản lý phòng khám</Typography>
                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>{user?.fullName?.slice(0, 1)}</Avatar>
                <Box sx={{ flex: { xs: 1, sm: "none" }, minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 600 }}>{user?.fullName || user?.username}</Typography><Typography variant="caption" color="text.secondary">{ROLE_LABELS[role]}</Typography></Box>
                <Button aria-label="Đăng xuất" startIcon={<LogoutOutlined />} disabled={loggingOut} onClick={handleLogout}>Đăng xuất</Button>
            </Stack>
            <Box component="main" sx={{ maxWidth: 1440, mx: "auto", p: { xs: 2, md: 4 } }}><Outlet /></Box>
        </Box>
    </Box>;
}
