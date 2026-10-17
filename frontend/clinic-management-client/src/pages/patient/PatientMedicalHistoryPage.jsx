import { useEffect, useRef } from "react";
import { Box, Breadcrumbs, Button, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import MedicalHistoryFilters from "../../components/internal/examinations/MedicalHistoryFilters";
import MedicalHistoryTable from "../../components/internal/examinations/MedicalHistoryTable";
import PatientMedicalHistorySummary from "../../components/patient/medical-history/PatientMedicalHistorySummary";
import useAuth from "../../hooks/useAuth";
import useMedicalHistory from "../../hooks/useMedicalHistory";

function PatientMedicalHistoryPage() {
    const { userId } = useAuth();
    const history = useMedicalHistory(null, { patientPortal: true, userId });
    const location = useLocation();
    const navigate = useNavigate();
    const restoredScroll = useRef(false);

    useEffect(() => {
        if (restoredScroll.current || history.summaryLoading || history.loading) return;
        const saved = location.state?.medicalHistoryReturn;
        const scrollY = saved?.userId === userId && saved.search === location.search ? saved.scrollY : 0;
        const frame = requestAnimationFrame(() => {
            window.scrollTo({ top: Number.isFinite(scrollY) ? scrollY : 0, behavior: "instant" });
            restoredScroll.current = true;
        });
        return () => cancelAnimationFrame(frame);
    }, [history.summaryLoading, history.loading, location.state, location.search, userId]);

    const viewRecord = (item) => {
        const medicalHistoryReturn = { userId, search: location.search, scrollY: window.scrollY };
        // Save the list entry too so the browser Back button restores the same position.
        navigate(`${location.pathname}${location.search}`, {
            replace: true, state: { ...location.state, medicalHistoryReturn },
        });
        navigate(`/medical-records/${item.medicalRecordId}${location.search}`, { state: { medicalHistoryReturn } });
    };

    return (
        <Box className="patient-medical-history" sx={{ bgcolor: "#F5F9FD", py: { xs: 3, md: 4 }, minHeight: "65vh", "& *": { letterSpacing: 0 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <Box className="medical-history-no-print">
                        <Breadcrumbs sx={{ fontSize: 12, mb: 2 }}>
                            <MuiLink component={Link} to="/" underline="hover" color="inherit">Trang chủ</MuiLink>
                            <Typography variant="caption" color="text.secondary">Cổng bệnh nhân</Typography>
                            <Typography variant="caption" sx={{ color: "#005DAC", fontWeight: 700 }}>Lịch sử khám</Typography>
                        </Breadcrumbs>
                        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                            <Typography component="h1" variant="h4" sx={{ color: "#111827", fontWeight: 800, lineHeight: 1.3 }}>Lịch sử khám của tôi</Typography>
                            <Button component={Link} to="/booking" variant="contained" startIcon={<CalendarMonthOutlinedIcon />}
                                sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>Đặt lịch khám mới</Button>
                        </Stack>
                    </Box>
                    {history.summaryLoading ? <Loading /> : history.summaryError ? <ErrorState message={history.summaryError} onRetry={history.reload} /> : history.summary && <>
                        <Box className="medical-history-no-print"><PatientMedicalHistorySummary summary={history.summary} /></Box>
                        <Box className="medical-history-no-print"><MedicalHistoryFilters filters={history.filters} onChange={history.updateFilters} onReset={history.resetFilters} /></Box>
                        <Box>
                            {history.error ? <ErrorState message={history.error} onRetry={history.reload} /> : history.loading ? <Loading /> :
                                <MedicalHistoryTable items={history.items} pagination={history.pagination} filters={history.filters}
                                    latestMedicalRecordId={history.summary.latestMedicalRecordId}
                                    onChange={history.updateFilters} onView={viewRecord} />}
                        </Box>
                    </>}
                </Stack>
            </Container>
        </Box>
    );
}

export default PatientMedicalHistoryPage;
