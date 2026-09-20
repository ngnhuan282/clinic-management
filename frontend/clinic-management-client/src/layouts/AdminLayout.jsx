// src/layouts/AdminLayout.jsx

import {
    Avatar,
    Badge,
    Box,
    Button,
    Divider,
    IconButton,
    InputBase,
    Stack,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import useAuth from "../hooks/useAuth";
import {
    Link as RouterLink,
    Outlet,
    useLocation,
} from "react-router-dom";

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 76;

const menuItems = [
    { label: "Khoa", path: "/internal/departments", icon: BusinessOutlinedIcon, roles: ["Admin"] },
    { label: "Chuyên khoa", path: "/internal/specializations", icon: BusinessOutlinedIcon, roles: ["Admin"] },
    { label: "Phòng", path: "/internal/rooms", icon: BusinessOutlinedIcon, roles: ["Admin"] },
    {
        label: "Tổng quan",
        path: "/internal/dashboard",
        icon: DashboardOutlinedIcon,
    },
    {
        label: "Lịch hẹn",
        path: "/internal/appointments",
        icon: CalendarMonthOutlinedIcon,
        count: "42",
    },
    {
        label: "Bệnh nhân",
        path: "/internal/patients",
        icon: PeopleAltOutlinedIcon,
    },
    {
        label: "Bác sĩ & Nhân sự",
        path: "/internal/doctors",
        icon: BadgeOutlinedIcon,
    },
    {
        label: "Hồ sơ bệnh án",
        path: "/internal/medical-records",
        icon: FolderSharedOutlinedIcon,
    },
    {
        label: "Kho dược & Vật tư",
        path: "/internal/medicines",
        activePrefix: "/internal/medicines",
        icon: LocalPharmacyOutlinedIcon,
        count: "3",
    },
    {
        label: "Xét nghiệm",
        path: "/internal/lab-test-types",
        roles: ["Admin", "Doctor"],
        icon: ScienceOutlinedIcon,
    },
    {
        label: "Viện phí & Thu ngân",
        path: "/internal/invoices",
        icon: PaymentsOutlinedIcon,
    },
    {
        label: "Báo cáo thống kê",
        path: "/internal/reports",
        icon: BarChartOutlinedIcon,
    },
    {
        label: "Cài đặt",
        path: "/internal/settings",
        icon: SettingsOutlinedIcon,
    },
];

function AdminLayout() {
    const { pathname } = useLocation();
    const { role, logout } = useAuth();

    const isMenuActive = (item) => {
        if (item.activePrefix) {
            return pathname.startsWith(item.activePrefix);
        }

        return pathname === item.path;
    };

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
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                        px: 2,
                        height: TOPBAR_HEIGHT,
                        pt: 1,
                        borderBottom: "1px solid #E5E9F0",
                        boxSizing: "border-box",
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
                        <LocalPharmacyOutlinedIcon />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: "#005DAC",
                                fontWeight: 800,
                                lineHeight: 1.2,
                            }}
                        >
                            MediFlow Admin
                        </Typography>

                        <Typography
                            variant="caption"
                            noWrap
                            sx={{ color: "#6B7280" }}
                        >
                            Phòng khám Đa khoa
                        </Typography>
                    </Box>
                </Stack>

                <Box sx={{ p: 1.5 }}>
                    <Button
                        component={RouterLink}
                        to="/internal/appointments"
                        fullWidth
                        variant="contained"
                        startIcon={<AddCircleOutlineOutlinedIcon />}
                        sx={{
                            py: 1.25,
                            fontWeight: 800,
                        }}
                    >
                        Thêm lịch khám mới
                    </Button>
                </Box>

                <Stack
                    component="nav"
                    spacing={0.5}
                    sx={{ px: 1.5, flex: 1 }}
                >
                        {menuItems.filter(item => !item.roles || item.roles.includes(role)).map((item) => {
                        const Icon = item.icon;
                        const isActive = isMenuActive(item);

                        return (
                            <Button
                                key={item.path}
                                component={RouterLink}
                                to={item.path}
                                startIcon={<Icon />}
                                fullWidth
                                sx={{
                                    justifyContent: "flex-start",
                                    minHeight: 44,
                                    px: 1.5,
                                    color: isActive
                                        ? "#005DAC"
                                        : "#4B5563",
                                    backgroundColor: isActive
                                        ? "#EFF6FF"
                                        : "transparent",
                                    fontWeight: isActive ? 800 : 600,
                                    "&:hover": {
                                        backgroundColor: "#F5F9FD",
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
                                        }}
                                    >
                                        {item.label}
                                    </Box>
                                    {item.count && (
                                        <Box
                                            component="span"
                                            sx={{
                                                minWidth: 24,
                                                ml: 1.25,
                                                px: 0.75,
                                                py: 0.15,
                                                borderRadius: 999,
                                                color: isActive
                                                    ? "#E11D48"
                                                    : "#2563EB",
                                                backgroundColor:
                                                    isActive
                                                        ? "#FFE4E6"
                                                        : "#DBEAFE",
                                                fontSize: 12,
                                                fontWeight: 800,
                                                textAlign: "center",
                                            }}
                                        >
                                            {item.count}
                                        </Box>
                                    )}
                                </Stack>
                            </Button>
                        );
                    })}
                </Stack>

                <Box sx={{ p: 1.5 }}>
                    <Divider sx={{ mb: 1.5 }} />

                    <Button
                        fullWidth
                        startIcon={<HelpOutlineOutlinedIcon />}
                        sx={{
                            justifyContent: "flex-start",
                            color: "#6B7280",
                            fontWeight: 700,
                        }}
                    >
                        Hỗ trợ kỹ thuật
                    </Button>

                    <Button
                        fullWidth
                        startIcon={<LogoutOutlinedIcon />}
                        onClick={() => logout().catch(() => {})}
                        sx={{
                            justifyContent: "flex-start",
                            color: "#DC2626",
                            fontWeight: 700,
                        }}
                    >
                        Đăng xuất
                    </Button>
                </Box>
            </Box>

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
                        py: 0,
                        display: "flex",
                        alignItems: "center",
                        boxSizing: "border-box",
                        borderBottom: "1px solid #E5E9F0",
                        backgroundColor: "rgba(255, 255, 255, 0.92)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-start"
                        gap={2}
                        sx={{ width: "100%" }}
                    >
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
                                    width: 260,
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
                                to="/internal/appointments"
                                variant="contained"
                                startIcon={<AddCircleOutlineOutlinedIcon />}
                                sx={{
                                    display: { xs: "none", md: "flex" },
                                    minHeight: 42,
                                    fontWeight: 800,
                                }}
                            >
                                Tiếp đón & Đặt hẹn mới
                            </Button>

                            <IconButton>
                                <Badge
                                    color="error"
                                    badgeContent={5}
                                >
                                    <NotificationsNoneOutlinedIcon />
                                </Badge>
                            </IconButton>

                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ minWidth: 0 }}
                            >
                                <Avatar
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        bgcolor: "#005DAC",
                                        fontWeight: 800,
                                    }}
                                >
                                    A
                                </Avatar>

                                <Box
                                    sx={{
                                        display: {
                                            xs: "none",
                                            md: "block",
                                        },
                                        minWidth: 0,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={{
                                            color: "#111827",
                                            fontWeight: 800,
                                        }}
                                    >
                                        Quản trị viên
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Admin
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

export default AdminLayout;
