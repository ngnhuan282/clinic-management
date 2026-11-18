import { useMemo, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import {
    AccountCircleRounded,
    AdminPanelSettingsRounded,
    AssignmentIndRounded,
    BarChartRounded,
    BiotechRounded,
    CalendarMonthRounded,
    DashboardRounded,
    DomainRounded,
    EditCalendarRounded,
    EventAvailableRounded,
    EventNoteRounded,
    FactCheckRounded,
    Inventory2Rounded,
    LocalHospitalRounded,
    LocalPharmacyRounded,
    LogoutRounded,
    ManageAccountsRounded,
    MedicalInformationRounded,
    MedicalServicesRounded,
    MeetingRoomRounded,
    MenuBookRounded,
    MenuRounded,
    MedicationRounded,
    OpenInNewRounded,
    PaymentsRounded,
    ScienceRounded,
    SettingsRounded,
    StarOutlineRounded,
} from "@mui/icons-material";
import {
    Link as RouterLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import NotificationBell from "../components/common/NotificationBell";
import RouteContent from "../components/common/RouteContent";
import { AdminAddIcon, clinicColors } from "../components/common/clinicUi";
import useAuth from "../hooks/useAuth";
import {
    INTERNAL_PAGES,
    ROLE_LABELS,
    canSeePage,
} from "../routes/roleAccess";

const SIDEBAR_WIDTH = 272;
const TOPBAR_HEIGHT = 70;

const MENU_ICONS = {
    "/internal/dashboard": DashboardRounded,
    "/internal/appointments": EventAvailableRounded,
    "/internal/patient-books": MenuBookRounded,
    "/internal/cashier/billing": PaymentsRounded,
    "/internal/examinations": MedicalServicesRounded,
    "/internal/doctor/lab-orders": BiotechRounded,
    "/internal/technician/lab-queue": ScienceRounded,
    "/internal/doctor/stock-reviews": FactCheckRounded,
    "/internal/doctor/schedule-requests": EditCalendarRounded,
    "/internal/department-schedules": EventNoteRounded,
    "/internal/department-statistics": BarChartRounded,
    "/internal/doctor-schedules": CalendarMonthRounded,
    "/internal/schedule-requests": FactCheckRounded,
    "/internal/departments": DomainRounded,
    "/internal/specializations": MedicalInformationRounded,
    "/internal/rooms": MeetingRoomRounded,
    "/internal/diseases": MedicalInformationRounded,
    "/internal/lab-test-types": ScienceRounded,
    "/internal/pharmacy/dispensing": LocalPharmacyRounded,
    "/internal/medicines": MedicationRounded,
    "/internal/pharmacy/inventory": Inventory2Rounded,
    "/internal/users": ManageAccountsRounded,
    "/internal/roles-permissions": AdminPanelSettingsRounded,
    "/internal/reviews": StarOutlineRounded,
    "/internal/settings": SettingsRounded,
    "/internal/doctor/profile": AssignmentIndRounded,
    "/internal/profile": AccountCircleRounded,
};

const ROLE_BRANDS = {
    Admin: {
        title: "MediFlow Admin",
        subtitle: "Hệ thống Quản trị Y tế",
    },
    Cashier: {
        title: "MediFlow Cashier",
        subtitle: "Nghiệp vụ Thu ngân",
    },
    Doctor: {
        title: "MediFlow Doctor",
        subtitle: "Nghiệp vụ Lâm sàng",
    },
    DepartmentHead: {
        title: "MediFlow Clinic",
        subtitle: "Điều hành Khoa phòng",
    },
    Receptionist: {
        title: "MediFlow Desk",
        subtitle: "Tiếp đón & Điều phối",
    },
    LabTechnician: {
        title: "MediFlow Lab",
        subtitle: "Xét nghiệm Cận lâm sàng",
    },
    Pharmacist: {
        title: "MediFlow Pharmacy",
        subtitle: "Dược & Cấp phát thuốc",
    },
};

function InternalLayout() {
    const { user, role, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const pages = useMemo(
        () => INTERNAL_PAGES.filter((page) => canSeePage(user, page)),
        [user]
    );

    const groupedPages = useMemo(() => {
        const groups = [];
        const map = new Map();
        pages.forEach((page) => {
            const key = page.group || "Chức năng";
            if (!map.has(key)) {
                const entry = { title: key, items: [] };
                map.set(key, entry);
                groups.push(entry);
            }
            map.get(key).items.push(page);
        });
        return groups;
    }, [pages]);

    const brand = ROLE_BRANDS[role] || {
        title: `MediFlow ${role || "Portal"}`,
        subtitle: "Không gian nội bộ",
    };
    const roleLabel = ROLE_LABELS[role] || role || "Nội bộ";
    const initial =
        user?.fullName?.trim()?.slice(0, 1) ||
        user?.username?.trim()?.slice(0, 1) ||
        role?.slice(0, 1) ||
        "A";

    const isMenuActive = (page) =>
        pathname === page.path || pathname.startsWith(`${page.path}/`);

    const activePage = pages.find(isMenuActive);

    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(new Date()),
        []
    );

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await logout();
        } catch {
            // Local credentials are cleared by the auth slice.
        } finally {
            navigate("/internal/login", { replace: true });
        }
    }

    const primaryActionPath =
        role === "Pharmacist"
            ? "/internal/pharmacy/dispensing"
            : role === "LabTechnician"
              ? "/internal/technician/lab-queue"
              : role === "Doctor" || role === "DepartmentHead"
                ? "/internal/examinations"
                : "/internal/appointments";

    const primaryActionLabel =
        role === "Pharmacist"
            ? "Quầy cấp thuốc"
            : role === "LabTechnician"
              ? "Hàng chờ xét nghiệm"
              : role === "Doctor" || role === "DepartmentHead"
                ? "Hàng chờ khám"
                : "Tiếp đón & Lịch hẹn";

    const showPrimaryAction =
        !pathname.startsWith(primaryActionPath) &&
        (role === "Doctor" ||
            role === "DepartmentHead" ||
            role === "LabTechnician" ||
            role === "Pharmacist" ||
            ((role === "Admin" || role === "Receptionist") &&
                user?.permissions?.includes("appointments.view")));

    const navigation = (
        <Stack sx={{ height: "100%", bgcolor: "#FFFFFF" }}>
            <Stack
                component={RouterLink}
                to="/internal/dashboard"
                direction="row"
                spacing={1.5}
                onClick={() => setMobileOpen(false)}
                sx={{
                    alignItems: "center",
                    minHeight: TOPBAR_HEIGHT,
                    px: 2.5,
                    color: "inherit",
                    textDecoration: "none",
                    borderBottom: "1px solid #E4ECF5",
                }}
            >
                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        color: "#FFFFFF",
                        bgcolor: clinicColors.primary,
                        flexShrink: 0,
                    }}
                >
                    <LocalHospitalRounded sx={{ fontSize: 23 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        noWrap
                        sx={{
                            color: clinicColors.heading,
                            fontSize: 17,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {brand.title}
                    </Typography>
                    <Typography
                        noWrap
                        sx={{
                            display: "block",
                            color: "#64748B",
                            fontSize: 12,
                            fontWeight: 600,
                            mt: 0.25,
                        }}
                    >
                        {brand.subtitle}
                    </Typography>
                </Box>
            </Stack>

            <Stack
                component="nav"
                aria-label="Điều hướng nội bộ"
                spacing={2}
                sx={{
                    px: 1.75,
                    py: 2,
                    flex: 1,
                    overflowY: "auto",
                }}
            >
                {groupedPages.map((group) => (
                    <Box key={group.title}>
                        {group.title !== "Tổng quan" && (
                            <Typography
                                sx={{
                                    px: 1.5,
                                    mb: 0.75,
                                    fontSize: 11,
                                    fontWeight: 750,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: "#64748B",
                                }}
                            >
                                {group.title}
                            </Typography>
                        )}

                        <Stack spacing={0.5}>
                            {group.items.map((page) => {
                                const Icon = MENU_ICONS[page.path] || DashboardRounded;
                                const selected = isMenuActive(page);

                                return (
                                    <Button
                                        key={page.path}
                                        component={RouterLink}
                                        to={page.to || page.path}
                                        startIcon={<Icon sx={{ fontSize: 20 }} />}
                                        fullWidth
                                        onClick={() => setMobileOpen(false)}
                                        sx={{
                                            justifyContent: "flex-start",
                                            minHeight: 42,
                                            px: 1.5,
                                            py: 0.85,
                                            borderRadius: "10px",
                                            textTransform: "none",
                                            fontSize: 14,
                                            color: selected ? clinicColors.primary : "#334155",
                                            bgcolor: selected ? "#E8F2FC" : "transparent",
                                            fontWeight: selected ? 750 : 600,
                                            position: "relative",
                                            "&::before": selected
                                                ? {
                                                      content: '""',
                                                      position: "absolute",
                                                      left: 0,
                                                      top: 8,
                                                      bottom: 8,
                                                      width: 3.5,
                                                      borderRadius: "0 4px 4px 0",
                                                      bgcolor: clinicColors.primary,
                                                  }
                                                : undefined,
                                            "& .MuiButton-startIcon": {
                                                mr: 1.25,
                                                color: selected ? clinicColors.primary : "#64748B",
                                            },
                                            "&:hover": {
                                                bgcolor: selected ? "#DCEBFA" : "#F3F7FB",
                                                color: selected ? clinicColors.primary : "#0A2540",
                                            },
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                                textAlign: "left",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {page.label}
                                        </Box>
                                    </Button>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </Stack>

            <Box sx={{ p: 2, borderTop: "1px solid #E4ECF5", bgcolor: "#FAFCFF" }}>
                <Stack spacing={0.75}>
                    <Button
                        component={RouterLink}
                        to="/"
                        fullWidth
                        startIcon={<OpenInNewRounded sx={{ fontSize: 18 }} />}
                        sx={{
                            justifyContent: "flex-start",
                            borderRadius: "10px",
                            textTransform: "none",
                            color: "#475569",
                            fontSize: 13.5,
                            fontWeight: 600,
                            minHeight: 38,
                            "&:hover": { bgcolor: "#EEF4FA", color: clinicColors.primary },
                        }}
                    >
                        Cổng thông tin bệnh nhân
                    </Button>

                    <Button
                        fullWidth
                        startIcon={<LogoutRounded sx={{ fontSize: 18 }} />}
                        disabled={loggingOut}
                        onClick={handleLogout}
                        sx={{
                            justifyContent: "flex-start",
                            borderRadius: "10px",
                            textTransform: "none",
                            color: "#B91C1C",
                            fontSize: 13.5,
                            fontWeight: 650,
                            minHeight: 38,
                            "&:hover": { bgcolor: "#FEF2F2" },
                        }}
                    >
                        Đăng xuất
                    </Button>
                </Stack>
            </Box>
        </Stack>
    );

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                bgcolor: "#F3F7FB",
            }}
        >
            <Box
                component="aside"
                sx={{
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    display: { xs: "none", lg: "flex" },
                    flexDirection: "column",
                    borderRight: "1px solid #DCE7F2",
                    bgcolor: "#FFFFFF",
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
                        width: 284,
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
                        minHeight: TOPBAR_HEIGHT,
                        px: { xs: 2, sm: 3, lg: 4 },
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid #DCE7F2",
                        bgcolor: "#FFFFFF",
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ width: "100%", alignItems: "center" }}
                    >
                        <IconButton
                            aria-label="Mở menu"
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                display: { lg: "none" },
                                flexShrink: 0,
                                color: clinicColors.heading,
                            }}
                        >
                            <MenuRounded />
                        </IconButton>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            {activePage?.group && activePage.group !== "Tổng quan" && (
                                <Typography
                                    noWrap
                                    sx={{
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        color: clinicColors.primary,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {activePage.group}
                                </Typography>
                            )}
                            <Typography
                                noWrap
                                sx={{
                                    fontSize: { xs: 15.5, sm: 17 },
                                    fontWeight: 750,
                                    color: clinicColors.heading,
                                }}
                            >
                                {activePage?.label || brand.title}
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center", flexShrink: 0 }}
                        >
                            <Chip
                                label={todayLabel}
                                size="small"
                                sx={{
                                    display: { xs: "none", xl: "inline-flex" },
                                    height: 32,
                                    px: 0.75,
                                    borderRadius: "9px",
                                    bgcolor: "#F3F7FB",
                                    color: "#475569",
                                    border: "1px solid #DCE7F2",
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                }}
                            />

                            {showPrimaryAction && (
                                <Button
                                    component={RouterLink}
                                    to={primaryActionPath}
                                    variant="contained"
                                    startIcon={<AdminAddIcon />}
                                    sx={{
                                        display: { xs: "none", md: "inline-flex" },
                                        minHeight: 38,
                                        px: 2,
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        bgcolor: clinicColors.primary,
                                        boxShadow: "none",
                                        "&:hover": {
                                            bgcolor: clinicColors.primaryDark,
                                            boxShadow: "none",
                                        },
                                    }}
                                >
                                    {primaryActionLabel}
                                </Button>
                            )}

                            <NotificationBell />

                            <Divider orientation="vertical" flexItem sx={{ my: 1.5, display: { xs: "none", sm: "block" } }} />

                            <Stack
                                component={RouterLink}
                                to="/internal/profile"
                                direction="row"
                                spacing={1.25}
                                sx={{
                                    minWidth: 0,
                                    alignItems: "center",
                                    textDecoration: "none",
                                    px: { xs: 0.5, sm: 1.25 },
                                    py: 0.65,
                                    borderRadius: "12px",
                                    "&:hover": { bgcolor: "#F3F7FB" },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        bgcolor: clinicColors.primary,
                                        color: "#FFFFFF",
                                        fontSize: 15,
                                        fontWeight: 750,
                                    }}
                                >
                                    {initial.toLocaleUpperCase("vi-VN")}
                                </Avatar>

                                <Box
                                    sx={{
                                        display: { xs: "none", md: "block" },
                                        minWidth: 0,
                                        maxWidth: 190,
                                    }}
                                >
                                    <Typography
                                        noWrap
                                        sx={{
                                            color: clinicColors.heading,
                                            fontSize: 13.5,
                                            fontWeight: 750,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {user?.fullName || user?.username || "Nhân sự nội bộ"}
                                    </Typography>

                                    <Typography
                                        noWrap
                                        sx={{
                                            display: "block",
                                            color: "#64748B",
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
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
                        maxWidth: 1480,
                        mx: "auto",
                        px: { xs: 2, sm: 3, lg: 4 },
                        py: { xs: 2.5, md: 3.5 },
                    }}
                >
                    <RouteContent />
                </Box>
            </Box>
        </Box>
    );
}

export default InternalLayout;
