import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: { main: "#1976D2", dark: "#1565C0", light: "#90CAF9" },
        secondary: { main: "#42A5F5" },
        success: { main: "#10B981", light: "#ECFDF5" },
        warning: { main: "#F59E0B", light: "#FFFBEB" },
        error: { main: "#EF4444", light: "#FEF2F2" },
        info: { main: "#2563EB", light: "#EFF6FF" },
        background: { default: "#F5F9FD", paper: "#FFFFFF" },
        text: { primary: "#1F2937", secondary: "#6B7280" },
        divider: "#E5E9F0",
    },
    typography: {
        fontFamily: '"Inter", system-ui, "Segoe UI", sans-serif',
        h4: { fontSize: "30px", lineHeight: "38px", fontWeight: 700, letterSpacing: "-0.02em" },
        h5: { fontSize: "24px", lineHeight: "32px", fontWeight: 600, letterSpacing: "-0.01em" },
        h6: { fontSize: "18px", lineHeight: "26px", fontWeight: 600 },
        body1: { fontSize: "16px", lineHeight: "24px" },
        body2: { fontSize: "14px", lineHeight: "20px" },
        caption: { fontSize: "12px", lineHeight: "16px", fontWeight: 600 },
        button: { fontSize: "14px", lineHeight: "20px", fontWeight: 600, textTransform: "none" },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: { styleOverrides: { root: { minHeight: 42, borderRadius: 8, padding: "10px 20px" } } },
        MuiTextField: { defaultProps: { size: "small" } },
        MuiOutlinedInput: { styleOverrides: { root: { minHeight: 42, backgroundColor: "#FFFFFF", borderRadius: 8, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 2, borderColor: "#1976D2" } } } },
        MuiTableCell: { styleOverrides: { root: { borderColor: "#E5E9F0", color: "#374151" }, head: { backgroundColor: "#F8FAFC", color: "#6B7280", fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" } } },
        MuiTableRow: { styleOverrides: { root: { height: 52, "&:hover": { backgroundColor: "#F5F9FD" } } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)" } } },
        MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 600 } } },
    },
});

export default theme;
