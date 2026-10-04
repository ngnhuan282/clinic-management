import { useState } from "react";
import { Alert, Badge, Box, Button, CircularProgress, IconButton, List, ListItemButton, ListItemText, Popover, Stack, Typography } from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import useNotifications from "../../hooks/useNotifications";
import getApiErrorMessage from "../../utils/errorHandler";

export default function NotificationBell() {
    const [anchor, setAnchor] = useState(null);
    const [readError, setReadError] = useState("");
    const { items, loading, error, refresh, pageNumber, setPageNumber, hasNextPage, markRead } = useNotifications();
    async function read(id) {
        setReadError("");
        try { await markRead(id); } catch (failure) { setReadError(getApiErrorMessage(failure)); }
    }
    return <>
        <IconButton aria-label="Thông báo" onClick={event => { setAnchor(event.currentTarget); refresh(); }}>
            <Badge variant="dot" color="error" invisible={!items.some(item => !item.isRead)}><NotificationsNoneOutlinedIcon /></Badge>
        </IconButton>
        <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <Box sx={{ width: 380, maxWidth: "90vw", p: 2 }}>
                <Typography variant="h6">Thông báo</Typography>
                {(error || readError) && <Alert severity="error" action={<Button onClick={refresh}>Thử lại</Button>}>{error || readError}</Alert>}
                {loading ? <CircularProgress size={24} aria-label="Đang tải thông báo" /> : !error && !items.length ? <Typography sx={{ py: 2 }}>Chưa có thông báo.</Typography> :
                    <List sx={{ maxHeight: 450, overflow: "auto" }}>{items.map(item => <ListItemButton key={item.notificationId} onClick={() => read(item.notificationId)} sx={{ bgcolor: item.isRead ? "transparent" : "#EFF6FF", mb: 1 }}>
                        <ListItemText primary={item.title} secondary={<>{item.message}<br />{new Date(item.createdAt + (item.createdAt.endsWith("Z") ? "" : "Z")).toLocaleString("vi-VN")}</>} />
                    </ListItemButton>)}</List>}
                <Stack direction="row" justifyContent="space-between">
                    <Button disabled={pageNumber === 1 || loading} onClick={() => setPageNumber(pageNumber - 1)}>Trước</Button>
                    <Typography sx={{ pt: 1 }}>Trang {pageNumber}</Typography>
                    <Button disabled={!hasNextPage || loading} onClick={() => setPageNumber(pageNumber + 1)}>Sau</Button>
                </Stack>
            </Box>
        </Popover>
    </>;
}
