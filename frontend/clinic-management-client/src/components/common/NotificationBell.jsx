import { useState } from "react";
import {
    Alert,
    Badge,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import useNotifications from "../../hooks/useNotifications";
import getApiErrorMessage from "../../utils/errorHandler";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { notificationDestination } from "../../utils/notificationNavigation";

export default function NotificationBell() {
    const navigate = useNavigate();
    const user = useAuth();
    const [anchor, setAnchor] = useState(null);
    const [readError, setReadError] = useState("");
    const { items, loading, error, refresh, pageNumber, setPageNumber, hasNextPage, markRead } =
        useNotifications();

    async function read(item) {
        setReadError("");
        try {
            await markRead(item.notificationId);
            const destination = notificationDestination(item, user);
            if (destination) {
                setAnchor(null);
                navigate(destination);
            }
        } catch (failure) {
            setReadError(getApiErrorMessage(failure));
        }
    }

    const unreadCount = items.filter(item => !item.isRead).length;

    return (
        <>
            <IconButton
                aria-label="Thông báo"
                onClick={event => {
                    setAnchor(event.currentTarget);
                    refresh();
                }}
                sx={{
                    border: "1px solid #C5D8EC",
                    bgcolor: "#F4F8FC",
                    color: "#0A2540",
                    borderRadius: "10px",
                    width: 42,
                    height: 42,
                    "&:hover": { bgcolor: "#E6F0FA", borderColor: "#0B4F8A", color: "#0B4F8A" },
                }}
            >
                <Badge variant="dot" color="error" invisible={unreadCount === 0}>
                    <NotificationsNoneOutlinedIcon sx={{ fontSize: 21 }} />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            borderRadius: "14px",
                            border: "1px solid #CEDCEB",
                            boxShadow: "0 16px 36px rgba(10, 37, 64, 0.14)",
                            overflow: "hidden",
                        },
                    },
                }}
            >
                <Box sx={{ width: 380, maxWidth: "calc(100vw - 24px)" }}>
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.75,
                            bgcolor: "#EAF2FA",
                            borderBottom: "1px solid #CEDCEB",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 800, color: "#0A2540" }}>
                            Thông báo
                        </Typography>
                        {unreadCount > 0 && (
                            <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "#0B4F8A" }}>
                                {unreadCount} chưa đọc
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ p: 2 }}>
                        {(error || readError) && (
                            <Alert
                                severity="error"
                                sx={{ mb: 1.5 }}
                                action={<Button onClick={refresh}>Thử lại</Button>}
                            >
                                {error || readError}
                            </Alert>
                        )}

                        {loading ? (
                            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                                <CircularProgress size={24} aria-label="Đang tải thông báo" />
                            </Box>
                        ) : !error && !items.length ? (
                            <Typography sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: 14.5 }}>
                                Chưa có thông báo.
                            </Typography>
                        ) : (
                            <List sx={{ maxHeight: 380, overflow: "auto", p: 0 }}>
                                {items.map(item => (
                                    <ListItemButton
                                        key={item.notificationId}
                                        onClick={() => read(item)}
                                        sx={{
                                            bgcolor: item.isRead ? "#FFFFFF" : "#E6F0FA",
                                            border: item.isRead ? "1px solid #E2ECF5" : "1px solid #90BCE6",
                                            borderRadius: "10px",
                                            mb: 1,
                                            alignItems: "flex-start",
                                            overflowWrap: "anywhere",
                                            "&:hover": { bgcolor: item.isRead ? "#F4F8FC" : "#D8E8F8" },
                                        }}
                                    >
                                        <ListItemText
                                            primary={item.title}
                                            primaryTypographyProps={{
                                                fontSize: 14.5,
                                                fontWeight: item.isRead ? 650 : 800,
                                                color: "#0A2540",
                                                mb: 0.35,
                                            }}
                                            secondary={
                                                <>
                                                    {item.message}
                                                    <br />
                                                    <Box component="span" sx={{ fontSize: 12, color: "#475569" }}>
                                                        {new Date(
                                                            item.createdAt +
                                                                (item.createdAt.endsWith("Z") ? "" : "Z")
                                                        ).toLocaleString("vi-VN")}
                                                    </Box>
                                                </>
                                            }
                                            secondaryTypographyProps={{ fontSize: 13.5, lineHeight: 1.55, color: "#334155" }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}

                        <Divider sx={{ my: 1.25, borderColor: "#E2ECF5" }} />

                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                            <Button
                                size="small"
                                disabled={pageNumber === 1 || loading}
                                onClick={() => setPageNumber(pageNumber - 1)}
                            >
                                Trước
                            </Button>
                            <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 650 }}>
                                Trang {pageNumber}
                            </Typography>
                            <Button
                                size="small"
                                disabled={!hasNextPage || loading}
                                onClick={() => setPageNumber(pageNumber + 1)}
                            >
                                Sau
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Popover>
        </>
    );
}
