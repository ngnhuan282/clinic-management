// src/layouts/PatientLayout.jsx

import { Box } from "@mui/material";
import RouteContent from "../components/common/RouteContent";
import Navbar from "./patient/Navbar";
import Footer from "./patient/Footer";

function PatientLayout() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Navbar />

            <Box component="main" sx={{ flex: 1 }}>
                <RouteContent />
            </Box>

            <Footer />
        </Box>
    );
}

export default PatientLayout;