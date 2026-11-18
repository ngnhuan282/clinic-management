import { useState } from "react";
import { Alert, Box, IconButton, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { CheckCircleRounded, CloseRounded, ErrorOutlineRounded } from "@mui/icons-material";
import useNotifications from "../../hooks/useNotifications";

export default function NotificationListener() {
    const { message, toasts = [], dismissToast } = useNotifications();
    const [dismissed, setDismissed] = useState(null);

    return (
        <>
            {toasts.length > 0 && (
                <Stack
                    spacing={1.25}
                    sx={{
                        position: "fixed",
                        top: { xs: 14, sm: 20 },
                        right: { xs: 14, sm: 22 },
                        left: { xs: 14, sm: "auto" },
                        width: { sm: 390 },
                        maxWidth: "calc(100vw - 28px)",
                        zIndex: 2200,
                        pointerEvents: "none",
                    }}
                >
                    {toasts.map((toast) => {
                        const isError = toast.severity === "error";
                        const durationMs = toast.duration || 4000;

                        return (
                            <Paper
                                key={toast.id}
                                role={isError ? "alert" : "status"}
                                elevation={0}
                                sx={{
                                    pointerEvents: "auto",
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "12px",
                                    bgcolor: isError ? "#991B1B" : "#DCFCE7",
                                    color: isError ? "#FFFFFF" : "#065F46",
                                    border: `1px solid ${isError ? "#7F1D1D" : "#86EFAC"}`,
                                    boxShadow: isError
                                        ? "0 14px 32px rgba(127, 29, 29, 0.28)"
                                        : "0 12px 28px rgba(6, 95, 70, 0.14)",
                                    animation: "clinic-toast-enter 180ms ease-out",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1.25}
                                    sx={{
                                        px: 2,
                                        pt: 1.5,
                                        pb: 1.85,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    {isError ? (
                                        <ErrorOutlineRounded
                                            sx={{
                                                fontSize: 22,
                                                color: "#FECACA",
                                                mt: "1px",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <CheckCircleRounded
                                            sx={{
                                                fontSize: 22,
                                                color: "#059669",
                                                mt: "1px",
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}

                                    <Typography
                                        sx={{
                                            flex: 1,
                                            fontSize: 14,
                                            fontWeight: 650,
                                            lineHeight: 1.5,
                                            color: isError ? "#FFFFFF" : "#065F46",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {toast.message}
                                    </Typography>

                                    <IconButton
                                        size="small"
                                        aria-label="Đóng thông báo"
                                        onClick={() => dismissToast?.(toast.id)}
                                        sx={{
                                            mt: -0.35,
                                            mr: -0.5,
                                            color: isError ? "rgba(255,255,255,0.88)" : "#047857",
                                            "&:hover": {
                                                bgcolor: isError
                                                    ? "rgba(255,255,255,0.14)"
                                                    : "rgba(5, 150, 105, 0.12)",
                                            },
                                        }}
                                    >
                                        <CloseRounded sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Stack>

                                <Box
                                    sx={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: 4,
                                        bgcolor: isError
                                            ? "rgba(255, 255, 255, 0.22)"
                                            : "rgba(5, 150, 105, 0.18)",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: "100%",
                                            width: "100%",
                                            transformOrigin: "left center",
                                            bgcolor: isError ? "#FCA5A5" : "#10B981",
                                            animation: `clinic-toast-progress ${durationMs}ms linear forwards`,
                                        }}
                                    />
                                </Box>
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            <Snackbar
                key={message?.createdAt}
                open={Boolean(message && dismissed !== message)}
                autoHideDuration={5000}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                onClose={() => setDismissed(message)}
            >
                <Alert severity="info" onClose={() => setDismissed(message)}>
                    {message?.message || ""}
                </Alert>
            </Snackbar>
        </>
    );
}
