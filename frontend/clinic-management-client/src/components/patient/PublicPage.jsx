import { Alert, Box, Breadcrumbs, Button, Container, Link, Skeleton, Stack, Typography } from "@mui/material";
import { ChevronRight, HomeOutlined } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

export default function PublicPage({ title, description, children }) {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "80vh", py: { xs: 3, md: 5.5 } }}>
            <Container maxWidth="lg">
                {/* Breadcrumb Navigation */}
                <Breadcrumbs
                    separator={<ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />}
                    aria-label="Đường dẫn"
                    sx={{ mb: { xs: 2.5, md: 3.5 }, fontSize: 13.5 }}
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="hover"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: "primary.main" } }}
                    >
                        <HomeOutlined sx={{ fontSize: 16 }} />
                        Trang chủ
                    </Link>
                    <Typography color="primary.main" sx={{ fontSize: "inherit", fontWeight: 650 }}>
                        {title}
                    </Typography>
                </Breadcrumbs>

                {/* Page Title & Description */}
                <Box sx={{ mb: { xs: 3.5, md: 4.5 }, maxWidth: 840 }}>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 26, sm: 32, md: 38 },
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "#0f2c4d",
                            lineHeight: 1.25,
                            mb: 1.5,
                        }}
                    >
                        {title}
                    </Typography>
                    {description && (
                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: 14.5, sm: 15.5 },
                                lineHeight: 1.75,
                                color: "#4b5563",
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>

                {children}
            </Container>
        </Box>
    );
}

export function ResourceState({ resource, children }) {
    if (resource.status === "loading") {
        return (
            <Stack spacing={2.5} role="status" aria-label="Đang tải dữ liệu">
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: "12px" }} />
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: "12px" }} />
            </Stack>
        );
    }
    if (resource.status === "error") {
        return (
            <Alert
                severity="error"
                sx={{ borderRadius: "12px", border: "1px solid #fecaca" }}
                action={
                    <Button color="inherit" size="small" onClick={resource.retry} sx={{ fontWeight: 600 }}>
                        Thử lại
                    </Button>
                }
            >
                {resource.error}
            </Alert>
        );
    }
    return children;
}
