import { Box, Stack, Typography } from "@mui/material";
import { clinicColors } from "./clinicUi";

export default function ClinicPageHeader({ title, description, icon: Icon, actions }) {
    return <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, minWidth: 0 }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start", minWidth: 0 }}>
            {Icon && <Box sx={{ width: 46, height: 46, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2.5, bgcolor: "#E0F2FE", color: clinicColors.primary }}><Icon fontSize="small" /></Box>}
            <Box sx={{ minWidth: 0 }}>
                <Typography component="h1" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.02em", color: clinicColors.heading }}>{title}</Typography>
                {description && <Typography sx={{ mt: 0.75, fontSize: 14, lineHeight: 1.65, maxWidth: 760, color: clinicColors.muted }}>{description}</Typography>}
            </Box>
        </Stack>
        {actions && <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}>{actions}</Stack>}
    </Stack>;
}
