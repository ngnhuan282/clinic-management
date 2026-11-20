import { useEffect } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import {
    CalendarMonthOutlined,
    HistoryOutlined,
    PersonOutlineOutlined,
    RateReviewOutlined,
    ReceiptLongOutlined,
    ScienceOutlined,
    VerifiedUserOutlined,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import RouteContent from "../components/common/RouteContent";
import useAuth from "../hooks/useAuth";
import Navbar from "./patient/Navbar";
import Footer from "./patient/Footer";

const PATIENT_PORTAL_LINKS = [
    { label: "Lịch hẹn của tôi", path: "/my-appointments", icon: CalendarMonthOutlined },
    { label: "Lịch sử khám", path: "/medical-records", icon: HistoryOutlined },
    { label: "Kết quả xét nghiệm", path: "/lab-results", icon: ScienceOutlined },
    { label: "Hóa đơn của tôi", path: "/invoices", icon: ReceiptLongOutlined },
    { label: "Đánh giá sau khám", path: "/my-reviews", icon: RateReviewOutlined },
    { label: "Hồ sơ cá nhân", path: "/profile", icon: PersonOutlineOutlined },
];

const PORTAL_PREFIXES = [
    "/my-appointments",
    "/medical-records",
    "/lab-results",
    "/invoices",
    "/my-reviews",
    "/profile",
];

function PatientLayout() {
    const { pathname } = useLocation();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    const showPortalBar =
        isAuthenticated &&
        role === "Patient" &&
        PORTAL_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#F4F7FA",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                component="a"
                href="#patient-main"
                sx={{
                    position: "absolute",
                    left: 8,
                    top: -100,
                    zIndex: 1400,
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: "#FFFFFF",
                    color: "#0B4F8A",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(10, 37, 64, 0.15)",
                    "&:focus": { top: 8 },
                }}
            >
                Đến nội dung chính
            </Box>

            <Navbar />

            {showPortalBar && (
                <Box
                    className="medical-history-no-print"
                    sx={{
                        bgcolor: "#FFFFFF",
                        borderBottom: "1px solid #CEDCEB",
                        py: 1.25,
                    }}
                >
                    <Container maxWidth="lg">
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.25}
                            sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
                        >
                            <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", color: "#0B4F8A" }}>
                                <VerifiedUserOutlined sx={{ fontSize: 18 }} />
                                <Typography sx={{ fontSize: 13, fontWeight: 750 }}>
                                    Không gian sức khỏe cá nhân
                                </Typography>
                            </Stack>
                            <Stack
                                component="nav"
                                aria-label="Tiện ích cổng bệnh nhân"
                                direction="row"
                                sx={{ flexWrap: "wrap", gap: 0.85 }}
                            >
                                {PATIENT_PORTAL_LINKS.map(({ label, path, icon: Icon }) => {
                                    const active = pathname === path || pathname.startsWith(path + "/");
                                    return (
                                        <Button
                                            key={path}
                                            component={Link}
                                            to={path}
                                            size="small"
                                            startIcon={<Icon sx={{ fontSize: 18 }} />}
                                            aria-current={active ? "page" : undefined}
                                            sx={{
                                                minHeight: 38,
                                                px: 1.6,
                                                py: 0.6,
                                                borderRadius: "8px",
                                                fontSize: 13.5,
                                                fontWeight: active ? 750 : 650,
                                                textTransform: "none",
                                                color: active ? "#FFFFFF" : "#0A2540",
                                                bgcolor: active ? "#0B4F8A" : "#F4F7FA",
                                                border: active ? "1px solid #0B4F8A" : "1px solid #C5D8EC",
                                                "&:hover": {
                                                    bgcolor: active ? "#083A66" : "#E6F0FA",
                                                    color: active ? "#FFFFFF" : "#0B4F8A",
                                                    borderColor: "#0B4F8A",
                                                },
                                            }}
                                        >
                                            {label}
                                        </Button>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            )}

            <Box id="patient-main" component="main" tabIndex={-1} sx={{ flex: 1 }}>
                <RouteContent />
            </Box>

            <Footer />
        </Box>
    );
}

export default PatientLayout;
