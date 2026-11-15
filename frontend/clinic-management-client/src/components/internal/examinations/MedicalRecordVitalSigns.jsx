import { Box, Typography } from "@mui/material";
import { getVitalSignReadings } from "../../../utils/medicalRecordVitals";

export default function MedicalRecordVitalSigns({ record }) {
    return <Box component="dl" aria-label="Chỉ số sinh tồn" sx={{ m: 0, display: "grid", gap: 2,
        gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
        {getVitalSignReadings(record).map(({ key, label, value }) => <Box key={key} sx={{ minWidth: 0 }}>
            <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.5, fontWeight: 700, overflowWrap: "anywhere" }}>{value}</Typography>
        </Box>)}
    </Box>;
}
