import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { CLINIC } from "../../data/publicContent";

const groups = [
    ["Khám & chăm sóc", [["Chuyên khoa", "/specialties"], ["Đội ngũ bác sĩ", "/doctors"], ["Dịch vụ y tế", "/services"], ["Bảng giá dịch vụ", "/pricing"], ["Đăng ký khám", "/booking"]]],
    ["Thông tin hữu ích", [["Về phòng khám", "/about"], ["Hướng dẫn bệnh nhân", "/health-guide"], ["Đánh giá của bệnh nhân", "/reviews"], ["Thông tin cá nhân", "/privacy"], ["Liên hệ & cơ sở", "/contact"]]],
];

export default function Footer() {
    return <Box component="footer" sx={{ mt: "auto", pt: 6, bgcolor: "#f8fafc", borderTop: "1px solid #e5e9f0" }}><Container maxWidth="lg">
        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}><Typography color="primary"   sx={{ fontWeight: 800, mb: 2 }}>{CLINIC.name}</Typography><Typography variant="body2" color="text.secondary"  sx={{ lineHeight: 1.9 }}>Tìm hiểu chuyên khoa, lựa chọn bác sĩ và chủ động đăng ký lịch khám cho bạn và gia đình.</Typography><Link href={CLINIC.phoneHref} sx={{ display: "block", fontSize: 21, fontWeight: 750, mt: 2 }}>{CLINIC.phone}</Link><Typography variant="caption" color="text.secondary">Tổng đài hỗ trợ đăng ký khám</Typography></Grid>
            {groups.map(([title, links]) => <Grid key={title} size={{ xs: 12, sm: 6, md: 2.5 }}><Typography   sx={{ fontWeight: 750, mb: 2 }}>{title}</Typography><Stack spacing={1.5}>{links.map(([label, path]) => <Link key={path} component={RouterLink} to={path} underline="hover" color="text.secondary"  sx={{ fontSize: 14 }}>{label}</Link>)}</Stack></Grid>)}
            <Grid size={{ xs: 12, md: 4 }}><Typography   sx={{ fontWeight: 750, mb: 2 }}>Cơ sở & giờ làm việc</Typography><Stack spacing={1.5}>
                {CLINIC.locations.map(location => <Box key={location.name}><Typography variant="body2"  sx={{ fontWeight: 650 }}>{location.name}</Typography><Typography variant="body2" color="text.secondary">{location.address}</Typography></Box>)}
                <Typography variant="body2" color="text.secondary">{CLINIC.hours}</Typography><Link href={"mailto:" + CLINIC.email} underline="hover" sx={{ fontSize: 14, overflowWrap: "anywhere" }}>{CLINIC.email}</Link>
            </Stack></Grid>
        </Grid>
        <Box sx={{ mt: 5, py: 2.5, borderTop: "1px solid #e5e9f0" }}><Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} {CLINIC.name}. <Link component={RouterLink} to="/privacy" underline="hover">Thông tin cá nhân khi đăng ký khám</Link></Typography></Box>
    </Container></Box>;
}
