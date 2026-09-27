import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ArrowForwardOutlined, ShieldOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { INTERNAL_PAGES, ROLE_LABELS, canSeePage } from "../../routes/roleAccess";

export default function DashboardPage() {
    const { user, role } = useAuth();
    const pages = INTERNAL_PAGES.filter(page => canSeePage(user, page) && !page.path.endsWith("dashboard"));
    return <Stack spacing={3}>
        <Box><Typography variant="overline" color="primary">{ROLE_LABELS[role] || role}</Typography><Typography variant="h4" component="h1">Xin chào, {user?.fullName}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Truy cập các chức năng dành cho vai trò của bạn.</Typography></Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
            {pages.map(page => <Paper key={page.path} variant="outlined" sx={{ p: 3 }}><Typography variant="h6">{page.label}</Typography><Button component={Link} to={page.path} endIcon={<ArrowForwardOutlined />} sx={{ mt: 2 }}>Mở chức năng</Button></Paper>)}
        </Box>
        {!pages.length && <Paper variant="outlined" sx={{ p: 4 }}><ShieldOutlined color="primary" /><Typography variant="h6" sx={{ mt: 1 }}>Chưa có chức năng khả dụng</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Vai trò này chưa có quyền sử dụng chức năng đã triển khai. Hãy liên hệ quản trị viên nếu cần thay đổi.</Typography></Paper>}
    </Stack>;
}
