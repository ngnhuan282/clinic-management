import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: { main: "#0B4F8A", dark: "#083A66", light: "#64A6DF" },
        secondary: { main: "#1565C0", dark: "#0D47A1", light: "#BBDEFB" },
        success: { main: "#059669", light: "#ECFDF5" },
        warning: { main: "#D97706", light: "#FFFBEB" },
        error: { main: "#DC2626", light: "#FEF2F2" },
        info: { main: "#0B4F8A", light: "#E6F0FA" },
        background: { default: "#F4F7FA", paper: "#FFFFFF" },
        text: { primary: "#0A2540", secondary: "#475569" },
        divider: "#CEDCEB",
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
        h4: { fontSize: "30px", lineHeight: "38px", fontWeight: 750, letterSpacing: "-0.02em" },
        h5: { fontSize: "24px", lineHeight: "32px", fontWeight: 700, letterSpacing: "-0.015em" },
        h6: { fontSize: "18px", lineHeight: "26px", fontWeight: 700 },
        body1: { fontSize: "16px", lineHeight: "25px" },
        body2: { fontSize: "14.5px", lineHeight: "22px" },
        caption: { fontSize: "12.5px", lineHeight: "18px", fontWeight: 600 },
        button: { fontSize: "14.5px", lineHeight: "20px", fontWeight: 650, textTransform: "none" },
    },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    minHeight: 44,
                    borderRadius: 10,
                    padding: "9px 18px",
                    fontWeight: 650,
                    transition: "background-color 0.15s ease, border-color 0.15s ease",
                },
                containedPrimary: {
                    backgroundColor: "#0B4F8A",
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#083A66",
                    },
                },
            },
        },
        MuiTextField: { defaultProps: { size: "small" } },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    minHeight: 44,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#B8CCE0",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#7FA5C9",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderWidth: 2,
                        borderColor: "#0B4F8A",
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderColor: "#DCE7F2", color: "#1E293B" },
                head: {
                    backgroundColor: "#EAF2FA",
                    color: "#0A2540",
                    fontSize: "12px",
                    fontWeight: 750,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: { height: 52, "&:hover": { backgroundColor: "#F4F8FC" } },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    border: "1px solid #CEDCEB",
                    boxShadow: "0 18px 40px rgba(10, 37, 64, 0.14)",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 8, fontWeight: 650 },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 12 },
            },
        },
    },
});

export default theme;
