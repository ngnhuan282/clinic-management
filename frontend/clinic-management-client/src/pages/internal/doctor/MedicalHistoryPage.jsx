import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import MedicalHistoryFilters from "../../../components/internal/examinations/MedicalHistoryFilters";
import MedicalHistoryPatientSummary from "../../../components/internal/examinations/MedicalHistoryPatientSummary";
import MedicalHistoryTable from "../../../components/internal/examinations/MedicalHistoryTable";
import useMedicalHistory from "../../../hooks/useMedicalHistory";

function MedicalHistoryPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { summary, summaryLoading, summaryError, items, pagination, filters, loading, error,
        updateFilters, resetFilters, reload } = useMedicalHistory(appointmentId);
    const examinationReturn = location.state?.examinationReturn;

    const returnToExamination = () => navigate(
        `/internal/examinations/${appointmentId}${examinationReturn?.screen === "record" ? "/record" : ""}`,
        { state: { appointment: examinationReturn?.appointment, medicalRecordDraft: examinationReturn?.draft } }
    );

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid #E5E9F0", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 2, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "#005DAC", fontWeight: 800 }}>Khám bệnh / Lịch sử khám</Typography>
                        <Typography component="h1" variant="h4" sx={{ mt: 1, color: "#111827", fontWeight: 800, lineHeight: 1.3 }}>Lịch sử khám của bệnh nhân</Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={returnToExamination}
                        sx={{ minHeight: 42, flexShrink: 0, alignSelf: { xs: "flex-start", md: "center" } }}>Quay lại lượt khám</Button>
                </Stack>
            </Paper>

            {summaryLoading ? <Loading /> : summaryError ? <ErrorState message={summaryError} onRetry={reload} /> : summary && <>
                <MedicalHistoryPatientSummary summary={summary} />
                <MedicalHistoryFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
                {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Loading /> :
                    <MedicalHistoryTable items={items} pagination={pagination} filters={filters}
                        latestMedicalRecordId={summary.latestMedicalRecordId} onChange={updateFilters}
                        onView={(item) => navigate(`/internal/examinations/${appointmentId}/history/${item.medicalRecordId}${location.search}`,
                            { state: { examinationReturn } })} />}
            </>}
        </Stack>
    );
}

export default MedicalHistoryPage;
