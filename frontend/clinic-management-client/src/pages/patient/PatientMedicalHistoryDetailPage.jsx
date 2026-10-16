import { useEffect } from "react";
import { Box, Breadcrumbs, Button, Container, GlobalStyles, Link as MuiLink, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import PatientMedicalHistoryDetail from "../../components/patient/medical-history/PatientMedicalHistoryDetail";
import useAuth from "../../hooks/useAuth";
import usePatientMedicalHistoryDetail from "../../hooks/usePatientMedicalHistoryDetail";

const printStyles = {
    "@media print": {
        "@page": { size: "A4", margin: "12mm" },
        ".MuiAppBar-root, footer, .medical-history-no-print": { display: "none !important" },
        ".patient-medical-history-detail": { backgroundColor: "#FFFFFF !important", padding: "0 !important", minHeight: 0 },
        ".patient-medical-history-detail > .MuiContainer-root": { maxWidth: "none", padding: 0 },
        ".patient-medical-history-detail .MuiPaper-root": { border: 0, borderRadius: 0, boxShadow: "none" },
        ".patient-medical-history-detail .medical-history-detail-identity": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        ".medical-history-detail-identity .MuiAvatar-root": { display: "none" },
        ".patient-medical-history-detail .medical-history-detail-identity dl": { borderTop: 0, borderLeft: "1px solid #E5E9F0", paddingTop: 0, paddingLeft: "16px" },
        ".patient-medical-history-detail .medical-history-clinical-grid": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
        ".patient-medical-history-detail .medical-history-clinical-grid > section + section": { borderTop: 0, borderLeft: "1px solid #E5E9F0" },
        ".patient-medical-history-detail .medical-history-field-heading": { minHeight: 0, padding: "12px" },
        ".patient-medical-history-detail .medical-history-clinical-content": { minHeight: 0, padding: "12px" },
        ".patient-medical-history-detail .MuiTableContainer-root": { overflow: "visible" },
        ".patient-medical-history-detail table": { minWidth: 0, width: "100%", tableLayout: "fixed" },
        ".patient-medical-history-detail td": { whiteSpace: "normal", overflowWrap: "anywhere" },
        ".patient-medical-history-detail tr": { breakInside: "avoid" },
        ".patient-medical-history-detail thead": { display: "table-header-group" },
    },
};

function PatientMedicalHistoryDetailPage() {
    const { medicalRecordId } = useParams();
    const parsedId = Number(medicalRecordId);
    const recordId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
    const { userId } = useAuth();
    const { detail, loading, error, reload } = usePatientMedicalHistoryDetail(recordId, userId);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [medicalRecordId]);

    const returnToHistory = () => {
        if (location.state?.medicalHistoryReturn?.userId === userId) navigate(-1);
        else navigate(`/medical-records${location.search}`, { replace: true });
    };

    return (
        <Box className="patient-medical-history-detail" sx={{ bgcolor: "#F5F9FD", py: { xs: 3, md: 4 }, minHeight: "65vh", "& *": { letterSpacing: 0 } }}>
            <GlobalStyles styles={printStyles} />
            <Container maxWidth="lg">
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <Box className="medical-history-no-print">
                        <Breadcrumbs sx={{ fontSize: 12, mb: 2 }}>
                            <MuiLink component={Link} to="/" underline="hover" color="inherit">Trang chủ</MuiLink>
                            <MuiLink component="button" onClick={returnToHistory} underline="hover" color="inherit" sx={{ fontSize: "inherit" }}>Lịch sử khám</MuiLink>
                            <Typography variant="caption" sx={{ color: "#005DAC", fontWeight: 700 }}>Chi tiết lượt khám</Typography>
                        </Breadcrumbs>
                        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                            <Typography component="h1" variant="h4" sx={{ color: "#111827", fontWeight: 800, lineHeight: 1.3 }}>Chi tiết lượt khám</Typography>
                            <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={returnToHistory}
                                sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>Quay lại lịch sử</Button>
                        </Stack>
                    </Box>
                    {!recordId ? <ErrorState message="Mã hồ sơ không hợp lệ." /> : loading ? <Loading /> : error ?
                        <ErrorState message={error} onRetry={reload} /> : detail &&
                        <PatientMedicalHistoryDetail detail={detail} />}
                </Stack>
            </Container>
        </Box>
    );
}

export default PatientMedicalHistoryDetailPage;
