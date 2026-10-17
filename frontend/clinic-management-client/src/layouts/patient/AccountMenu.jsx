import { useId, useState } from "react";
import { Avatar, Box, Button, Divider, ListItemIcon, ListSubheader, Menu, MenuItem, Skeleton, Tooltip, Typography } from "@mui/material";
import { CalendarMonthOutlined, DashboardOutlined, KeyboardArrowDownRounded, LogoutOutlined, PersonOutlineOutlined, ScienceOutlined, StarOutlineRounded } from "@mui/icons-material";

const triggerSx = {
    width: 220,
    minWidth: 0,
    minHeight: 44,
    px: 1.25,
    py: 0.75,
    gap: 1,
    borderRadius: "12px",
    borderColor: "#D9E7F2",
    bgcolor: "#F8FBFE",
    color: "primary.main",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    textTransform: "none",
    transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
    "&:hover": { bgcolor: "#EFF6FC", borderColor: "#A8CEE9" },
    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
    "&.Mui-disabled": { borderColor: "#D9E7F2", bgcolor: "#F8FBFE" },
};

const itemSx = {
    mx: 1,
    px: 1.5,
    py: 1.25,
    minHeight: 46,
    borderRadius: "8px",
    color: "#374151",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    transition: "background-color 140ms ease, color 140ms ease",
    "& .MuiListItemIcon-root": { minWidth: 36, color: "#65839A" },
    "& .MuiSvgIcon-root": { fontSize: 20 },
    "&:hover, &.Mui-focusVisible": {
        bgcolor: "#EDF6FD",
        color: "primary.main",
        "& .MuiListItemIcon-root": { color: "primary.main" },
    },
    "&.Mui-focusVisible": { outline: "2px solid #A8CEE9", outlineOffset: -2 },
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
        ...(patient ? [{ label: "Kết quả xét nghiệm", path: "/lab-results", icon: ScienceOutlined }] : []),
        { label: "Hồ sơ cá nhân", path: "/profile", icon: PersonOutlineOutlined },
        ...(patient ? [{ label: "Đánh giá sau khám", path: "/my-reviews", icon: StarOutlineRounded }] : []),
    ];

    const close = () => setAnchor(null);
    const navigate = path => { close(); onNavigate(path); };

    return <>
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
                        if (event.key === "ArrowDown") { event.preventDefault(); setAnchor(event.currentTarget); }
                    }}
                    sx={{ ...triggerSx, ...(fullWidth ? { width: "100%" } : {}) }}
                >
                    <Avatar aria-hidden="true" sx={{ width: 28, height: 28, flexShrink: 0, bgcolor: "#E5F1FB", color: "primary.main" }}>
                        <PersonOutlineOutlined sx={{ fontSize: 19 }} />
                    </Avatar>
                    <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "left" }}>
                        {ready ? displayName : <Skeleton width="100%" animation={false} />}
                    </Box>
                    <KeyboardArrowDownRounded aria-hidden="true" sx={{ fontSize: 18, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
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
                paper: { sx: { mt: 1, width: 288, maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100dvh - 24px)", border: "1px solid #E5E9F0", borderRadius: "12px", bgcolor: "#FFFFFF", boxShadow: "0 16px 40px rgba(15, 55, 85, 0.10), 0 4px 12px rgba(15, 55, 85, 0.05)" } },
                list: { "aria-labelledby": triggerId, sx: { py: 1 } },
            }}
        >
            <ListSubheader disableSticky sx={{ px: 2.5, pt: 1, pb: 1.5, lineHeight: 1.5, bgcolor: "transparent" }}>
                <Typography sx={{ mb: 0.5, fontSize: 12, fontWeight: 400, color: "#6B7280" }}>Đã đăng nhập</Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.55, fontWeight: 600, color: "#1F2937", overflowWrap: "anywhere" }}>{displayName}</Typography>
                {ready && user.username && user.username !== displayName && <Typography sx={{ mt: 0.5, fontSize: 12, lineHeight: 1.5, color: "#6B7280", overflowWrap: "anywhere" }}>{user.username}</Typography>}
            </ListSubheader>
            <Divider component="li" sx={{ mx: 2, mb: 1, borderColor: "#EDF1F5" }} />
            {items.map(({ label, path, icon: Icon }) => <MenuItem key={path} onClick={() => navigate(path)} sx={itemSx}>
                <ListItemIcon><Icon /></ListItemIcon>
                {label}
            </MenuItem>)}
            <Divider component="li" sx={{ mx: 2, my: 1, borderColor: "#EDF1F5" }} />
            <MenuItem onClick={() => { close(); onLogout(); }} sx={{ ...itemSx, color: "#A54444", "& .MuiListItemIcon-root": { minWidth: 36, color: "#A54444" }, "&:hover, &.Mui-focusVisible": { bgcolor: "#FFF3F2", color: "#923C3C", "& .MuiListItemIcon-root": { color: "#923C3C" } } }}>
                <ListItemIcon><LogoutOutlined /></ListItemIcon>
                Đăng xuất
            </MenuItem>
        </Menu>
    </>;
}
