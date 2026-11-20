// src/App.jsx

import { useEffect } from "react";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from "./routes/AppRoutes";
import theme from "./theme";
import AuthSession from "./components/common/AuthSession";
import NotificationListener from "./components/common/NotificationListener";
import NotificationProvider from "./components/common/NotificationProvider";
import { useClinicInfo } from "./api/publicApi";

function ClinicDocumentMeta() {
    const clinic = useClinicInfo();

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.title = `${clinic.name} - Đặt lịch khám & Chăm sóc sức khỏe`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", `${clinic.name} - ${clinic.description}`);
        }
    }, [clinic.name, clinic.description]);

    return null;
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ClinicDocumentMeta />
            <AuthSession>
                <NotificationProvider>
                <NotificationListener />
                <AppRoutes />
                </NotificationProvider>
            </AuthSession>
        </ThemeProvider>
    );
}

export default App;
