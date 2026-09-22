import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import { connectNotifications } from "../../services/signalrService";

export default function NotificationListener() {
    const { userId, role, isAuthenticated } = useAuth();
    const [notification, setNotification] = useState(null);
    useEffect(() => {
        if (!isAuthenticated) return;
        return connectNotifications(message => setNotification({ ...message, userId }));
    }, [isAuthenticated, userId, role]);
    return <Snackbar open={Boolean(isAuthenticated && notification?.userId === userId)} autoHideDuration={6000} onClose={() => setNotification(null)}>
        <Alert severity="info" onClose={() => setNotification(null)}>{notification?.message || ""}</Alert>
    </Snackbar>;
}
