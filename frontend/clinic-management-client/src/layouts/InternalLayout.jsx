import { useState } from "react";
import {
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    InputBase,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
    Link as RouterLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import {
    INTERNAL_PAGES,
    ROLE_LABELS,
} from "../routes/roleAccess";

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 76;

const MENU_ICONS = {
    "/internal/dashboard": DashboardOutlinedIcon,
    "/internal/examinations": CalendarMonthOutlinedIcon,
    "/internal/diseases": FactCheckOutlinedIcon,
    "/internal/users": BadgeOutlinedIcon,
    "/internal/departments": BusinessOutlinedIcon,
    "/internal/specializations": PeopleAltOutlinedIcon,
    "/internal/rooms": FolderSharedOutlinedIcon,
    "/internal/medicines": LocalPharmacyOutlinedIcon,
    "/internal/lab-test-types": ScienceOutlinedIcon,
    "/internal/invoices": PaymentsOutlinedIcon,
    "/internal/reports": BarChartOutlinedIcon,
    "/internal/settings": SettingsOutlinedIcon,
};

const ROLE_BRANDS = {
    Admin: {
        title: "MediFlow Admin",
        subtitle: "Phòng khám Đa khoa",
    },
    Doctor: {
        title: "MediFlow Doctor",
        subtitle: "Nghiệp vụ lâm sàng",
    },
    Receptionist: {
        title: "MediFlow Desk",
        subtitle: "Tiếp nhận & Thu ngân",
    },
};

function getBadgeForPage(page) {
    if (page.path === "/internal/medicines") {
        return "3";
    }

    return "";
}

function InternalLayout() {
    const {
        user,
        role,
        logout,
    } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const pages = INTERNAL_PAGES.filter((page) =>
        page.roles.includes(role)
    );
    const brand = ROLE_BRANDS[role] || ROLE_BRANDS.Admin;
    const roleLabel = ROLE_LABELS[role] || role || "Nội bộ";
    const initial =
        user?.fullName?.trim()?.slice(0, 1) ||
        user?.username?.trim()?.slice(0, 1) ||
        role?.slice(0, 1) ||
        "A";

    const isMenuActive = (page) =>
        pathname === page.path ||
        pathname.startsWith(`${page.path}/`);

    async function handleLogout() {
        setLoggingOut(true);

        try {
            await logout();
        } catch {
            // Local credentials are removed by the auth slice.
        } finally {
            navigate("/internal/login", { replace: true });
        }
    }

    const primaryActionPath =
        role === "Doctor"
            ? "/internal/examinations"
            : "/internal/dashboard";
    const primaryActionLabel =
        role === "Doctor"
            ? "Gọi lượt kế tiếp"
            : "Tiếp đón & Đặt hẹn mới";

    const navigation = (
        <Stack sx={{ height: "100%" }}>
            <Stack
                component={RouterLink}
                to="/internal/dashboard"
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                    height: TOPBAR_HEIGHT,
                    px: 2,
                    pt: 1,
                    boxSizing: "border-box",
                    color: "inherit",
                    textDecoration: "none",
                    borderBottom: "1px solid #E5E9F0",
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: "#FFFFFF",
                        backgroundColor: "#005DAC",
                        boxShadow:
                            "0 8px 18px rgba(0, 93, 172, 0.18)",
                    }}
                >
                    <LocalHospitalOutlinedIcon />
                </Box>

                <Box
                    sx={{
                        minWidth: 0,
                        minHeight: 44,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            color: "#005DAC",
                            fontWeight: 900,
                            lineHeight: 1.08,
                        }}
                    >
                        {brand.title}
                    </Typography>

                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            display: "block",
                            color: "#6B7280",
                            fontWeight: 600,
                            lineHeight: 1.25,
                        }}
                    >
                        {brand.subtitle}
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ p: 1.5 }}>
                <Button
                    component={RouterLink}
                    to={primaryActionPath}
                    fullWidth
                    variant="contained"
                    startIcon={<AddCircleOutlineOutlinedIcon />}
                    sx={{
                        minHeight: 44,
                        fontWeight: 900,
                        boxShadow:
                            "0 8px 18px rgba(0, 93, 172, 0.18)",
                    }}
                >
                    {primaryActionLabel}
                </Button>
            </Box>

            <Stack
                component="nav"
                spacing={0.5}
                sx={{
                    px: 1.5,
                    flex: 1,
                    overflowY: "auto",
                }}
            >
                {pages.map((page) => {
                    const Icon =
                        MENU_ICONS[page.path] ||
                        DashboardOutlinedIcon;
                    const selected = isMenuActive(page);
                    const badge = getBadgeForPage(page);

                    return (
                        <Button
                            key={page.path}
                            component={RouterLink}
                            to={page.path}
                            startIcon={<Icon />}
                            fullWidth
                            onClick={() => setMobileOpen(false)}
                            sx={{
                                justifyContent: "flex-start",
                                minHeight: 44,
                                px: 1.5,
                                color: selected
                                    ? "#005DAC"
                                    : "#4B5563",
                                backgroundColor: selected
                                    ? "#EFF6FF"
                                    : "transparent",
                                borderLeft: selected
                                    ? "3px solid #1976D2"
                                    : "3px solid transparent",
                                fontWeight: selected ? 900 : 700,
                                "& .MuiButton-startIcon": {
                                    color: selected
                                        ? "#005DAC"
                                        : "#4B5563",
                                },
                                "&:hover": {
                                    backgroundColor: selected
                                        ? "#EFF6FF"
                                        : "#F5F9FD",
                                },
                            }}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ width: "100%" }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        textAlign: "left",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {page.label}
                                </Box>

                                {badge && (
                                    <Box
                                        component="span"
                                        sx={{
                                            minWidth: 24,
                                            ml: 1.25,
                                            px: 0.75,
                                            py: 0.15,
                                            borderRadius: 999,
                                            color: selected
                                                ? "#E11D48"
                                                : "#2563EB",
                                            backgroundColor: selected
                                                ? "#FFE4E6"
                                                : "#DBEAFE",
                                            fontSize: 12,
                                            fontWeight: 900,
                                            textAlign: "center",
                                        }}
                                    >
                                        {badge}
                                    </Box>
                                )}
                            </Stack>
                        </Button>
                    );
                })}
            </Stack>

            <Box sx={{ p: 1.5 }}>
                <Divider sx={{ mb: 1.5 }} />

                <Chip
                    size="small"
                    label={roleLabel}
                    color="primary"
                    variant="outlined"
                    sx={{
                        mb: 1,
                        maxWidth: "100%",
                        fontWeight: 800,
                    }}
                />

                <Button
                    component={RouterLink}
                    to="/"
                    fullWidth
                    startIcon={<HelpOutlineOutlinedIcon />}
                    sx={{
                        justifyContent: "flex-start",
                        color: "#6B7280",
                        fontWeight: 800,
                    }}
                >
                    Hỗ trợ kỹ thuật
                </Button>

                <Button
                    fullWidth
                    startIcon={<LogoutOutlinedIcon />}
                    disabled={loggingOut}
                    onClick={handleLogout}
                    sx={{
                        justifyContent: "flex-start",
                        color: "#DC2626",
                        fontWeight: 800,
                    }}
                >
                    Đăng xuất
                </Button>
            </Box>
        </Stack>
    );

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                backgroundColor: "#F6FAFE",
            }}
        >
            <Box
                component="aside"
                sx={{
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    display: { xs: "none", lg: "flex" },
                    flexDirection: "column",
                    borderRight: "1px solid #E5E9F0",
                    backgroundColor: "#FFFFFF",
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                }}
            >
                {navigation}
            </Box>

            <Drawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                sx={{
                    display: { xs: "block", lg: "none" },
                    "& .MuiDrawer-paper": {
                        width: 280,
                    },
                }}
            >
                {navigation}
            </Drawer>

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    component="header"
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        height: TOPBAR_HEIGHT,
                        px: { xs: 2, md: 3 },
                        display: "flex",
                        alignItems: "center",
                        boxSizing: "border-box",
                        borderBottom: "1px solid #E5E9F0",
                        backgroundColor: "rgba(255, 255, 255, 0.94)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={2}
                        sx={{ width: "100%" }}
                    >
                        <IconButton
                            aria-label="Mở menu"
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                display: { lg: "none" },
                                flexShrink: 0,
                            }}
                        >
                            <MenuOutlinedIcon />
                        </IconButton>

                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                            sx={{
                                minWidth: 0,
                                flexShrink: 0,
                            }}
                        >
                            <Box
                                sx={{
                                    display: { xs: "none", md: "flex" },
                                    alignItems: "center",
                                    width: { md: 260, xl: 320 },
                                    height: 44,
                                    px: 1.5,
                                    borderRadius: 2,
                                    border: "1px solid #E5E9F0",
                                    backgroundColor: "#F8FAFC",
                                }}
                            >
                                <SearchOutlinedIcon
                                    sx={{
                                        mr: 1,
                                        color: "#6B7280",
                                    }}
                                />

                                <InputBase
                                    placeholder="Tìm kiếm nhanh..."
                                    sx={{
                                        flex: 1,
                                        fontSize: 14,
                                    }}
                                />
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<BusinessOutlinedIcon />}
                                sx={{
                                    display: { xs: "none", sm: "flex" },
                                    height: 44,
                                    flexShrink: 0,
                                    color: "#374151",
                                    borderColor: "#D6DADE",
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                Cơ sở 1: 128 Nguyễn Trãi
                            </Button>
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                            sx={{
                                ml: "auto",
                                flexShrink: 0,
                            }}
                        >
                            <Button
                                component={RouterLink}
                                to={primaryActionPath}
                                variant="contained"
                                startIcon={<AddCircleOutlineOutlinedIcon />}
                                sx={{
                                    display: { xs: "none", md: "flex" },
                                    minHeight: 42,
                                    fontWeight: 900,
                                    boxShadow:
                                        "0 8px 18px rgba(0, 93, 172, 0.16)",
                                }}
                            >
                                {primaryActionLabel}
                            </Button>

                            <Tooltip title="Thông báo">
                                <IconButton aria-label="Thông báo">
                                    <Badge
                                        color="error"
                                        badgeContent={5}
                                    >
                                        <NotificationsNoneOutlinedIcon />
                                    </Badge>
                                </IconButton>
                            </Tooltip>

                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ minWidth: 0 }}
                            >
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: "#005DAC",
                                        fontWeight: 900,
                                    }}
                                >
                                    {initial.toLocaleUpperCase("vi-VN")}
                                </Avatar>

                                <Box
                                    sx={{
                                        display: {
                                            xs: "none",
                                            md: "block",
                                        },
                                        minWidth: 0,
                                        maxWidth: 220,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={{
                                            color: "#111827",
                                            fontWeight: 900,
                                        }}
                                    >
                                        {user?.fullName ||
                                            user?.username ||
                                            "Người dùng nội bộ"}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {roleLabel}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        width: "100%",
                        maxWidth: 1440,
                        mx: "auto",
                        p: { xs: 2, md: 3 },
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

export default InternalLayout;
