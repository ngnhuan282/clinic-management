import { useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import useNotifications from "../../hooks/useNotifications";

export default function NotificationListener() {
    const { message } = useNotifications();
    const [dismissed, setDismissed] = useState(null);
    return <Snackbar key={message?.createdAt} open={Boolean(message && dismissed !== message)} autoHideDuration={6000} onClose={() => setDismissed(message)}>
        <Alert severity="info" onClose={() => setDismissed(message)}>{message?.message || ""}</Alert>
    </Snackbar>;
}
