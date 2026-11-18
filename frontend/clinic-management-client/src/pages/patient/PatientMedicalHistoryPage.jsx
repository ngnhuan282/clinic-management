import { useEffect, useRef } from "react";
import { Box, Button, Container, Stack } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import { clinicPageCanvasSx, clinicPrimaryButtonSx } from "../../components/common/clinicUi";
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

    const viewRecord = item => {
        const medicalHistoryReturn = { userId, search: location.search, scrollY: window.scrollY };
        navigate(`${location.pathname}${location.search}`, {
            replace: true,
            state: { ...location.state, medicalHistoryReturn },
        });
        navigate(`/medical-records/${item.medicalRecordId}${location.search}`, {
            state: { medicalHistoryReturn },
        });
    };

    return (
        <Box className="patient-medical-history" sx={{ ...clinicPageCanvasSx, "& *": { letterSpacing: 0 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <Box className="medical-history-no-print">
                        <ClinicPageHeader
                            eyebrow="Bệnh án điện tử"
                            title="Lịch sử khám của tôi"
                            icon={HistoryOutlinedIcon}
                            description="Tra cứu hồ sơ bệnh án các lượt khám đã hoàn tất, chẩn đoán y khoa, chỉ số sinh tồn và đơn thuốc được kê."
                            actions={
                                <Button
                                    component={Link}
                                    to="/booking"
                                    variant="contained"
                                    startIcon={<CalendarMonthOutlinedIcon />}
                                    sx={{ ...clinicPrimaryButtonSx, px: 2.5 }}
                                >
                                    Đặt lịch khám mới
                                </Button>
                            }
                        />
                    </Box>

                    {history.summaryLoading ? (
                        <Loading />
                    ) : history.summaryError ? (
                        <ErrorState message={history.summaryError} onRetry={history.reload} />
                    ) : (
                        history.summary && (
                            <>
                                <Box className="medical-history-no-print">
                                    <PatientMedicalHistorySummary summary={history.summary} />
                                </Box>
                                <Box className="medical-history-no-print">
                                    <MedicalHistoryFilters
                                        filters={history.filters}
                                        onChange={history.updateFilters}
                                        onReset={history.resetFilters}
                                    />
                                </Box>
                                <Box>
                                    {history.error ? (
                                        <ErrorState message={history.error} onRetry={history.reload} />
                                    ) : history.loading ? (
                                        <Loading />
                                    ) : (
                                        <MedicalHistoryTable
                                            items={history.items}
                                            pagination={history.pagination}
                                            filters={history.filters}
                                            latestMedicalRecordId={history.summary.latestMedicalRecordId}
                                            onChange={history.updateFilters}
                                            onView={viewRecord}
                                        />
                                    )}
                                </Box>
                            </>
                        )
                    )}
                </Stack>
            </Container>
        </Box>
    );
}

export default PatientMedicalHistoryPage;
