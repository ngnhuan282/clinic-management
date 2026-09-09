import { Box, CircularProgress } from "@mui/material";

function Loading({ fullScreen = false }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: fullScreen ? "100vh" : "200px",
                width: "100%",
            }}
        >
            <CircularProgress />
        </Box>
    );
}

export default Loading;