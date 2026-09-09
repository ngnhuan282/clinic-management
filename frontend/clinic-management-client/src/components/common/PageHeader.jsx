// src/components/common/PageHeader.jsx

import { Box, Button, Stack, Typography } from "@mui/material";

function PageHeader({
    title,
    subtitle,
    actionLabel,
    onAction,
    actionIcon,
}) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 3 }}
        >
            <Box>
                <Typography
                    variant="h5"
                    fontWeight={700}
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {actionLabel && (
                <Button
                    variant="contained"
                    startIcon={actionIcon}
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </Stack>
    );
}

export default PageHeader;