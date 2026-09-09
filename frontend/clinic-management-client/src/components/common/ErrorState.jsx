// src/components/common/ErrorState.jsx

import { Alert, Box, Button } from "@mui/material";

function ErrorState({
    message = "Something went wrong.",
    onRetry,
}) {
    return (
        <Box sx={{ width: "100%" }}>
            <Alert
                severity="error"
                action={
                    onRetry ? (
                        <Button
                            color="inherit"
                            size="small"
                            onClick={onRetry}
                        >
                            Retry
                        </Button>
                    ) : null
                }
            >
                {message}
            </Alert>
        </Box>
    );
}

export default ErrorState;