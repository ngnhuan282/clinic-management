import { lazy } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { DashboardOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import GuestBookingPage from "./GuestBookingPage";
import PublicPage from "../../components/patient/PublicPage";

const BookingPage = lazy(() => import("./BookingPage"));

export default function PublicBookingPage() {
    const { isAuthenticated, role } = useAuth();
    if (!isAuthenticated) return <GuestBookingPage />;
    if (role === "Patient") return <BookingPage />;
    return (
        <PublicPage
            badge="Tài khoản nội bộ"
            title="Đăng ký khám trực tuyến"
            description="Cổng đặt lịch trực tuyến dành cho bệnh nhân và khách vãng lai."
        >
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: "18px",
                    borderColor: "#DCE7F2",
                    bgcolor: "#FFFFFF",
                    maxWidth: 680,
                }}
            >
                <Stack spacing={2.5} sx={{ alignItems: "flex-start" }}>
                    <Typography sx={{ fontWeight: 750, fontSize: 17, color: "#0B2545" }}>
                        Bạn đang đăng nhập bằng tài khoản nhân sự nội bộ
                    </Typography>
                    <Alert severity="info" sx={{ width: "100%", borderRadius: "12px" }}>
                        Vui lòng chuyển sang tài khoản bệnh nhân hoặc đăng xuất để đăng ký khám với tư cách khách. Nhân viên tiếp nhận có thể tạo lịch hẹn trực tiếp trong cổng quản lý nội bộ.
                    </Alert>
                    <Button
                        component={Link}
                        to="/internal"
                        variant="contained"
                        startIcon={<DashboardOutlined />}
                        sx={{ borderRadius: "10px" }}
                    >
                        Về cổng nhân viên
                    </Button>
                </Stack>
            </Paper>
        </PublicPage>
    );
}
