// src/App.jsx

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from "./routes/AppRoutes";
import theme from "./theme";
import AuthSession from "./components/common/AuthSession";
import NotificationListener from "./components/common/NotificationListener";
import NotificationProvider from "./components/common/NotificationProvider";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
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
