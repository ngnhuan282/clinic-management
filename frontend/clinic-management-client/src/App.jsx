// src/App.jsx

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from "./routes/AppRoutes";
import theme from "./theme";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRoutes />
        </ThemeProvider>
    );
}

export default App;