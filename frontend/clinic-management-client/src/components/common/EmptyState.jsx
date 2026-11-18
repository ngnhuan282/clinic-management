import { HealthAndSafetyOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

function EmptyState({ message = "Chưa có dữ liệu.", title, action }) {
    return (
        <Box
            sx={{
                minHeight: "200px",
                py: 3,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 1.25,
                color: "text.secondary",
            }}
        >
            <Box
                sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#E6F0FA",
                    color: "#0B4F8A",
                    border: "1px solid #B8D4F0",
                    mb: 0.5,
                }}
            >
                <HealthAndSafetyOutlined sx={{ fontSize: 30 }} />
            </Box>

            {title && (
                <Typography sx={{ fontWeight: 750, fontSize: 17, color: "#0A2540" }}>
                    {title}
                </Typography>
            )}

            <Typography variant="body1" sx={{ fontSize: 15, maxWidth: 460, lineHeight: 1.65, color: "#475569" }}>
                {message}
            </Typography>

            {action && <Box sx={{ mt: 1 }}>{action}</Box>}
        </Box>
    );
}

export default EmptyState;
