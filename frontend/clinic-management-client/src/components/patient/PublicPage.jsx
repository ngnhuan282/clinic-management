import { Alert, Box, Breadcrumbs, Button, Container, Link, Skeleton, Stack, Typography } from "@mui/material";
import { ChevronRight, HomeOutlined } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

export default function PublicPage({ title, description, badge, children }) {
    return (
        <Box sx={{ bgcolor: "#F4F7FA", minHeight: "82vh", pb: { xs: 5, md: 7 } }}>
            {/* Solid Calm Blue Header Band */}
            <Box
                sx={{
                    pt: { xs: 3, md: 4.5 },
                    pb: { xs: 3.5, md: 5 },
                    mb: { xs: 3, md: 4.5 },
                    bgcolor: "#EAF2FA",
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Container maxWidth="lg">
                    <Breadcrumbs
                        separator={<ChevronRight sx={{ fontSize: 16, color: "#64748B" }} />}
                        aria-label="Đường dẫn"
                        sx={{ mb: { xs: 2, md: 2.5 }, fontSize: 14 }}
                    >
                        <Link
                            component={RouterLink}
                            to="/"
                            underline="hover"
                            color="text.secondary"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontWeight: 550,
                                color: "#334155",
                                "&:hover": { color: "primary.main" },
                            }}
                        >
                            <HomeOutlined sx={{ fontSize: 17 }} />
                            Trang chủ
                        </Link>
                        <Typography color="primary.main" sx={{ fontSize: "inherit", fontWeight: 750 }}>
                            {title}
                        </Typography>
                    </Breadcrumbs>

                    <Box sx={{ maxWidth: 840 }}>
                        {badge && (
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    px: 1.5,
                                    py: 0.4,
                                    mb: 1.25,
                                    borderRadius: "8px",
                                    bgcolor: "#FFFFFF",
                                    border: "1px solid #90BCE6",
                                    color: "#0B4F8A",
                                    fontSize: 12.5,
                                    fontWeight: 750,
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {badge}
                            </Box>
                        )}
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 26, sm: 32, md: 38 },
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                color: "#0A2540",
                                lineHeight: 1.25,
                                mb: description ? 1.25 : 0,
                            }}
                        >
                            {title}
                        </Typography>
                        {description && (
                            <Typography
                                sx={{
                                    fontSize: { xs: 15, sm: 16 },
                                    lineHeight: 1.75,
                                    color: "#334155",
                                }}
                            >
                                {description}
                            </Typography>
                        )}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">{children}</Container>
        </Box>
    );
}

export function ResourceState({ resource, children }) {
    if (resource.status === "loading") {
        return (
            <Stack spacing={2.5} role="status" aria-label="Đang tải dữ liệu">
                <Skeleton variant="rounded" height={84} sx={{ borderRadius: "14px" }} />
                <Skeleton variant="rounded" height={168} sx={{ borderRadius: "14px" }} />
            </Stack>
        );
    }
    if (resource.status === "error") {
        return (
            <Alert
                severity="error"
                sx={{ borderRadius: "12px", border: "1px solid #FECACA", bgcolor: "#FEF2F2" }}
                action={
                    <Button color="inherit" size="small" onClick={resource.retry} sx={{ fontWeight: 700 }}>
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
