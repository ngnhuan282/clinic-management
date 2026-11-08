// src/layouts/PatientLayout.jsx

import { Box } from "@mui/material";
import RouteContent from "../components/common/RouteContent";
import Navbar from "./patient/Navbar";
import Footer from "./patient/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function PatientLayout() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box component="a" href="#patient-main" sx={{ position: "absolute", left: 8, top: -100, zIndex: 1400, p: 1.5, bgcolor: "white", "&:focus": { top: 8 } }}>Đến nội dung chính</Box>
            <Navbar />

            <Box id="patient-main" component="main" tabIndex={-1} sx={{ flex: 1 }}>
                <RouteContent />
            </Box>

            <Footer />
        </Box>
    );
}

export default PatientLayout;