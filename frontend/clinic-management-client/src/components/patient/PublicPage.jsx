import { Alert, Box, Breadcrumbs, Button, Container, Link, Skeleton, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function PublicPage({ title, description, children }) {
    return <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Breadcrumbs aria-label="Đường dẫn" sx={{ mb: 3, fontSize: 14 }}>
            <Link component={RouterLink} to="/" underline="hover">Trang chủ</Link>
            <Typography color="text.secondary"  sx={{ fontSize: "inherit" }}>{title}</Typography>
        </Breadcrumbs>
        <Box sx={{ mb: 4, maxWidth: 820 }}>
            <Typography component="h1" variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800, mb: 1.5 }}>{title}</Typography>
            {description && <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{description}</Typography>}
        </Box>
        {children}
    </Container>;
}

export function ResourceState({ resource, children }) {
    if (resource.status === "loading") return <Stack spacing={2} role="status" aria-label="Đang tải dữ liệu">
        <Skeleton variant="rounded" height={100} /><Skeleton variant="rounded" height={180} />
    </Stack>;
    if (resource.status === "error") return <Alert severity="error" action={<Button color="inherit" onClick={resource.retry}>Thử lại</Button>}>{resource.error}</Alert>;
    return children;
}
