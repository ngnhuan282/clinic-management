import { useEffect } from "react";
import { Box, Breadcrumbs, Button, Container, GlobalStyles, Link as MuiLink, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import { clinicPageCanvasSx, clinicSecondaryButtonSx } from "../../components/common/clinicUi";
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
        <Box className="patient-medical-history-detail" sx={{ ...clinicPageCanvasSx, "& *": { letterSpacing: 0 } }}>
            <GlobalStyles styles={printStyles} />
            <Container maxWidth="lg">
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <Box className="medical-history-no-print">
                        <Breadcrumbs sx={{ fontSize: 13, mb: 2 }}>
                            <MuiLink component={Link} to="/" underline="hover" color="inherit">
                                Trang chủ
                            </MuiLink>
                            <MuiLink
                                component="button"
                                onClick={returnToHistory}
                                underline="hover"
                                color="inherit"
                                sx={{ fontSize: "inherit" }}
                            >
                                Lịch sử khám
                            </MuiLink>
                            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, fontSize: 13 }}>
                                Chi tiết lượt khám
                            </Typography>
                        </Breadcrumbs>

                        <ClinicPageHeader
                            eyebrow="Hồ sơ lâm sàng & đơn thuốc"
                            title="Chi tiết lượt khám"
                            icon={AssignmentOutlinedIcon}
                            description="Thông tin chẩn đoán, chỉ số sinh tồn, đơn thuốc chỉ định và hóa đơn thuốc của buổi khám."
                            actions={
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBackRoundedIcon />}
                                    onClick={returnToHistory}
                                    sx={clinicSecondaryButtonSx}
                                >
                                    Quay lại lịch sử
                                </Button>
                            }
                        />
                    </Box>

                    {!recordId ? (
                        <ErrorState message="Mã hồ sơ không hợp lệ." />
                    ) : loading ? (
                        <Loading />
                    ) : error ? (
                        <ErrorState message={error} onRetry={reload} />
                    ) : (
                        detail && <PatientMedicalHistoryDetail detail={detail} />
                    )}
                </Stack>
            </Container>
        </Box>
    );
}

export default PatientMedicalHistoryDetailPage;
