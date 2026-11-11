import { lazy } from "react";
import { Alert, Button } from "@mui/material";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import GuestBookingPage from "./GuestBookingPage";
import PublicPage from "../../components/patient/PublicPage";

const BookingPage = lazy(() => import("./BookingPage"));

export default function PublicBookingPage() {
    const { isAuthenticated, role } = useAuth();
    if (!isAuthenticated) return <GuestBookingPage />;
    if (role === "Patient") return <BookingPage />;
    return <PublicPage title="Đăng ký khám"><Alert severity="info">Bạn đang sử dụng tài khoản nhân viên. Vui lòng dùng tài khoản bệnh nhân hoặc đăng xuất để đăng ký với tư cách khách.</Alert><Button component={Link} to="/internal" sx={{ mt: 2 }}>Về cổng nhân viên</Button></PublicPage>;
}
