// src/components/common/EmptyState.jsx

import { InboxOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

function EmptyState({
    message = "No data available.",
}) {
    return (
        <Box
            sx={{
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                color: "text.secondary",
            }}
        >
            <InboxOutlined sx={{ fontSize: 48 }} />

            <Typography variant="body1">
                {message}
            </Typography>
        </Box>
    );
}

export default EmptyState;