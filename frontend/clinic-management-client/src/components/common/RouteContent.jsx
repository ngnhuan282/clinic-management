import { Suspense } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function RouteContent() {
    return <Suspense fallback={<Box role="status" aria-label="Đang tải trang" sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Đang tải trang…</Typography>
    </Box>}>
        <Outlet />
    </Suspense>;
}
