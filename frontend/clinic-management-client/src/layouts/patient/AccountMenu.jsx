import { useId, useState } from "react";
import { Avatar, Box, Button, Divider, ListItemIcon, ListSubheader, Menu, MenuItem, Skeleton, Tooltip, Typography } from "@mui/material";
import { CalendarMonthOutlined, DashboardOutlined, HistoryOutlined, KeyboardArrowDownRounded, LogoutOutlined, PersonOutlineOutlined, ScienceOutlined, StarOutlineRounded } from "@mui/icons-material";

const triggerSx = {
    width: 220,
    minWidth: 0,
    minHeight: 44,
    px: 1.25,
    py: 0.75,
    gap: 1,
    borderRadius: "12px",
    borderColor: "#B8CCE0",
    bgcolor: "#F4F8FC",
    color: "primary.main",
    fontSize: 14.5,
    fontWeight: 650,
    lineHeight: 1.5,
    textTransform: "none",
    transition: "background-color 160ms ease, border-color 160ms ease",
    "&:hover": { bgcolor: "#E6F0FA", borderColor: "#0B4F8A" },
    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
    "&.Mui-disabled": { borderColor: "#CEDCEB", bgcolor: "#F4F7FA" },
};

const itemSx = {
    mx: 1,
    px: 1.5,
    py: 1.2,
    minHeight: 46,
    borderRadius: "8px",
    color: "#1E293B",
    fontSize: 14.5,
    fontWeight: 600,
    lineHeight: 1.5,
    transition: "background-color 140ms ease, color 140ms ease",
    "& .MuiListItemIcon-root": { minWidth: 36, color: "#0B4F8A" },
    "& .MuiSvgIcon-root": { fontSize: 20 },
    "&:hover, &.Mui-focusVisible": {
        bgcolor: "#E6F0FA",
        color: "primary.main",
        "& .MuiListItemIcon-root": { color: "primary.main" },
    },
    "&.Mui-focusVisible": { outline: "2px solid #90BCE6", outlineOffset: -2 },
};

export default function AccountMenu({ user, role, sessionChecked, fullWidth = false, onNavigate, onLogout }) {
    const [anchor, setAnchor] = useState(null);
    const menuId = useId();
    const triggerId = useId();
    const ready = sessionChecked && Boolean(user);
    const displayName = ready ? (user.fullName?.trim() || user.username?.trim() || "Tài khoản") : "";
    const open = ready && Boolean(anchor);
    const patient = role === "Patient";
    const items = [
        patient
            ? { label: "Đặt lịch khám", path: "/booking", icon: CalendarMonthOutlined }
            : { label: "Trang quản lý", path: "/internal/dashboard", icon: DashboardOutlined },
        ...(patient ? [{ label: "Lịch hẹn của tôi", path: "/my-appointments", icon: CalendarMonthOutlined }] : []),
        ...(patient ? [{ label: "Lịch sử khám", path: "/medical-records", icon: HistoryOutlined }] : []),
        ...(patient ? [{ label: "Kết quả xét nghiệm", path: "/lab-results", icon: ScienceOutlined }] : []),
        { label: "Hồ sơ cá nhân", path: "/profile", icon: PersonOutlineOutlined },
        ...(patient ? [{ label: "Đánh giá sau khám", path: "/my-reviews", icon: StarOutlineRounded }] : []),
    ];

    const close = () => setAnchor(null);
    const navigate = path => {
        close();
        onNavigate(path);
    };

    return (
        <>
            <Tooltip title={displayName} describeChild placement="bottom">
                <span style={{ display: "inline-flex", width: fullWidth ? "100%" : undefined }}>
                    <Button
                        id={triggerId}
                        variant="outlined"
                        fullWidth={fullWidth}
                        disabled={!ready}
                        aria-label={ready ? `${displayName}, mở menu tài khoản` : "Đang tải tài khoản"}
                        aria-busy={!ready}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        aria-controls={open ? menuId : undefined}
                        onClick={event => setAnchor(event.currentTarget)}
                        onKeyDown={event => {
                            if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setAnchor(event.currentTarget);
                            }
                        }}
                        sx={{ ...triggerSx, ...(fullWidth ? { width: "100%" } : {}) }}
                    >
                        <Avatar
                            aria-hidden="true"
                            sx={{
                                width: 28,
                                height: 28,
                                flexShrink: 0,
                                bgcolor: "#0B4F8A",
                                color: "#FFFFFF",
                            }}
                        >
                            <PersonOutlineOutlined sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box
                            component="span"
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                textAlign: "left",
                                color: "#0A2540",
                            }}
                        >
                            {ready ? displayName : <Skeleton width="100%" animation={false} />}
                        </Box>
                        <KeyboardArrowDownRounded
                            aria-hidden="true"
                            sx={{
                                fontSize: 18,
                                flexShrink: 0,
                                transform: open ? "rotate(180deg)" : "none",
                                transition: "transform 160ms ease",
                            }}
                        />
                    </Button>
                </span>
            </Tooltip>
            <Menu
                id={menuId}
                anchorEl={anchor}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                marginThreshold={12}
                transitionDuration={{ enter: 180, exit: 140 }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            width: 288,
                            maxWidth: "calc(100vw - 24px)",
                            maxHeight: "calc(100dvh - 24px)",
                            border: "1px solid #CEDCEB",
                            borderRadius: "12px",
                            bgcolor: "#FFFFFF",
                            boxShadow: "0 16px 36px rgba(10, 37, 64, 0.14)",
                        },
                    },
                    list: { "aria-labelledby": triggerId, sx: { py: 1 } },
                }}
            >
                <ListSubheader disableSticky sx={{ px: 2.5, pt: 1, pb: 1.5, lineHeight: 1.5, bgcolor: "transparent" }}>
                    <Typography sx={{ mb: 0.35, fontSize: 12, fontWeight: 750, color: "#0B4F8A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {patient ? "Hồ sơ bệnh nhân" : "Tài khoản nội bộ"}
                    </Typography>
                    <Typography sx={{ fontSize: 15.5, lineHeight: 1.5, fontWeight: 750, color: "#0A2540", overflowWrap: "anywhere" }}>
                        {displayName}
                    </Typography>
                    {ready && user.username && user.username !== displayName && (
                        <Typography sx={{ mt: 0.35, fontSize: 12.5, lineHeight: 1.5, color: "#475569", overflowWrap: "anywhere" }}>
                            @{user.username}
                        </Typography>
                    )}
                </ListSubheader>
                <Divider component="li" sx={{ mx: 2, mb: 1, borderColor: "#E2ECF5" }} />
                {items.map(({ label, path, icon: Icon }) => (
                    <MenuItem key={path} onClick={() => navigate(path)} sx={itemSx}>
                        <ListItemIcon>
                            <Icon />
                        </ListItemIcon>
                        {label}
                    </MenuItem>
                ))}
                <Divider component="li" sx={{ mx: 2, my: 1, borderColor: "#E2ECF5" }} />
                <MenuItem
                    onClick={() => {
                        close();
                        onLogout();
                    }}
                    sx={{
                        ...itemSx,
                        color: "#B91C1C",
                        "& .MuiListItemIcon-root": { minWidth: 36, color: "#B91C1C" },
                        "&:hover, &.Mui-focusVisible": {
                            bgcolor: "#FEF2F2",
                            color: "#991B1B",
                            "& .MuiListItemIcon-root": { color: "#991B1B" },
                        },
                    }}
                >
                    <ListItemIcon>
                        <LogoutOutlined />
                    </ListItemIcon>
                    Đăng xuất
                </MenuItem>
            </Menu>
        </>
    );
}
