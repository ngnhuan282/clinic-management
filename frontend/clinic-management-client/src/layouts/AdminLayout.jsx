// src/layouts/AdminLayout.jsx

import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

function AdminLayout() {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                backgroundColor: "#F5F9FD",
            }}
        >
            <Box
                component="main"
                sx={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

export default AdminLayout;