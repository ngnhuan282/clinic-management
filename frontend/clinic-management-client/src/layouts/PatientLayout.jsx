// src/layouts/PatientLayout.jsx

import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

function PatientLayout() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#F5F9FD",
            }}
        >
            <Box component="main">
                <Outlet />
            </Box>
        </Box>
    );
}

export default PatientLayout;