import { useState } from "react";
import {
    Alert,
    Button,
    Container,
    Typography
} from "@mui/material";

import { pingBackend } from "../api/testApi";

function BackendTestPage() {
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleTestBackend = async () => {
        try {
            setError("");

            const data = await pingBackend();

            console.log("Backend response:", data);

            setMessage(data.result);
        } catch (err) {
            console.error("Backend error:", err);

            setMessage("");

            setError(
                err.response?.data?.message ||
                "Cannot connect to backend"
            );
        }
    };

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Backend Connection Test
            </Typography>

            <Button
                variant="contained"
                onClick={handleTestBackend}
            >
                Test Backend
            </Button>

            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Container>
    );
}

export default BackendTestPage;