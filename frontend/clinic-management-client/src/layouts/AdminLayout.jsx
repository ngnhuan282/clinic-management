import { Apartment, Dashboard, MeetingRoom, MedicalServices, Menu, People } from "@mui/icons-material";
import { AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = 260;
const links = [
    { label: "Tổng quan", path: "/internal/dashboard", icon: <Dashboard /> },
    { label: "Khoa", path: "/internal/departments", icon: <Apartment /> },
    { label: "Chuyên khoa", path: "/internal/specializations", icon: <MedicalServices /> },
    { label: "Phòng", path: "/internal/rooms", icon: <MeetingRoom /> },
    { label: "Bệnh nhân", path: "/internal/patients", icon: <People /> },
];

function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const drawer = <Box sx={{ height: "100%", backgroundColor: "#FFFFFF", borderRight: "1px solid #E5E9F0" }}>
        <Toolbar sx={{ px: 3 }}>
            <Typography variant="h6" color="primary.dark">Clinic Admin</Typography>
        </Toolbar>
        <List sx={{ px: 1.5 }}>
            {links.map((link) => <ListItemButton component={Link} to={link.path} key={link.path} selected={location.pathname === link.path} onClick={() => setMobileOpen(false)} sx={{ borderRadius: 2, mb: 0.5, "&.Mui-selected": { color: "primary.dark", backgroundColor: "#EFF6FF" }, "&.Mui-selected .MuiListItemIcon-root": { color: "primary.main" } }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{link.icon}</ListItemIcon><ListItemText primary={link.label} />
            </ListItemButton>)}
        </List>
    </Box>;
    return <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
        <AppBar position="fixed" color="inherit" elevation={0} sx={{ display: { md: "none" }, borderBottom: "1px solid", borderColor: "divider" }}>
            <Toolbar><IconButton onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu /></IconButton><Typography variant="h6" sx={{ ml: 1 }}>Clinic Admin</Typography></Toolbar>
        </AppBar>
        <Drawer variant="permanent" sx={{ display: { xs: "none", md: "block" }, width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}>{drawer}</Drawer>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}>{drawer}</Drawer>
        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 10, md: 4 } }}><Outlet /></Box>
    </Box>;
}

export default AdminLayout;
