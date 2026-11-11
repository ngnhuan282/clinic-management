import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CalendarMonthOutlined, LocalHospitalOutlined, MedicalServicesOutlined, PersonSearchOutlined } from "@mui/icons-material";

const shortcuts = [
    [LocalHospitalOutlined, "Chuyên khoa", "Tìm hiểu các chuyên khoa", "/specialties"],
    [PersonSearchOutlined, "Đội ngũ bác sĩ", "Chọn bác sĩ phù hợp", "/doctors"],
    [MedicalServicesOutlined, "Dịch vụ & bảng giá", "Tham khảo chi phí dịch vụ", "/pricing"],
    [CalendarMonthOutlined, "Đăng ký khám", "Chủ động chọn giờ khám", "/booking"],
];

export default function StatsSection() {
    return <Box component="section" aria-label="Truy cập nhanh" sx={{ py: 4 }}><Container maxWidth="lg"><Grid container spacing={2}>
        {shortcuts.map(([Icon, title, text, path]) => <Grid key={path} size={{ xs: 12, sm: 6, md: 3 }}><Paper component={Link} to={path} variant="outlined" sx={{ display: "flex", p: 2.5, gap: 2, alignItems: "center", textDecoration: "none", height: "100%", borderRadius: 3, transition: "border-color .2s", "&:hover": { borderColor: "primary.main", bgcolor: "#f8fbff" } }}>
            <Icon color="primary" fontSize="large" /><Box><Typography color="text.primary"  sx={{ fontWeight: 750 }}>{title}</Typography><Typography variant="body2" color="text.secondary"  sx={{ mt: 0.5 }}>{text}</Typography></Box>
        </Paper></Grid>)}
    </Grid></Container></Box>;
}
