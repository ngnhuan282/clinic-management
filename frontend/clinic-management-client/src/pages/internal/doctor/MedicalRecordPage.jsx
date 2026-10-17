import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getPrescriptionByMedicalRecord } from "../../../api/prescriptionApi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import MedicalRecordFormSections from "../../../components/internal/examinations/MedicalRecordFormSections";
import MedicalRecordPaperBookSection from "../../../components/internal/examinations/MedicalRecordPaperBookSection";
import MedicalRecordPatientSummary from "../../../components/internal/examinations/MedicalRecordPatientSummary";
import MedicalRecordStatusPanel from "../../../components/internal/examinations/MedicalRecordStatusPanel";
import MedicalRecordPrescriptionPanel from "../../../components/internal/prescriptions/MedicalRecordPrescriptionPanel";
import useMedicalRecordForm from "../../../hooks/useMedicalRecordForm";
import getApiErrorMessage from "../../../utils/errorHandler";

function MedicalRecordPage() {
    const { appointmentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const initialAppointment = useMemo(
        () => location.state?.appointment || null,
        [location.state]
    );

    const {
        appointment,
        diseases,
        medicalRecord,
        form,
        loading,
        saving,
        error,
        actionError,
        recordConflict,
        successMessage,
        selectedDiagnoses,
        completionReady,
        createDraft,
        updateField,
        addDiagnosisRow,
        updateDiagnosisRow,
        setPrimaryDiagnosis,
        removeDiagnosisRow,
        submitRecord,
        reload,
        clearActionError,
        clearSuccessMessage,
    } = useMedicalRecordForm({
        appointmentId,
        initialAppointment,
        initialDraft: location.state?.medicalRecordDraft,
    });

    const [
        completeWithoutPrescriptionOpen,
        setCompleteWithoutPrescriptionOpen,
    ] = useState(false);
    const [prescriptionResult, setPrescriptionResult] = useState(null);
    const [reloadRecordOpen, setReloadRecordOpen] = useState(false);
    const [prescriptionRetry, setPrescriptionRetry] = useState(0);
    const medicalRecordId = medicalRecord?.medicalRecordId;
    const prescriptionKey = JSON.stringify([appointmentId, medicalRecordId, medicalRecord?.updatedAt, prescriptionRetry]);
    const currentPrescription = prescriptionResult?.key === prescriptionKey ? prescriptionResult : null;
    const prescription = currentPrescription?.value || null;
    const prescriptionError = currentPrescription?.error || "";
    const checkingPrescription = Boolean(medicalRecordId) && !currentPrescription;
    const retryPrescription = () => setPrescriptionRetry((value) => value + 1);

    useEffect(() => {
        let ignore = false;

        if (!medicalRecordId) return;

        getPrescriptionByMedicalRecord(medicalRecordId)
            .then((result) => {
                if (!ignore) {
                    setPrescriptionResult({ key: prescriptionKey, value: result || null });
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setPrescriptionResult({ key: prescriptionKey, error: getApiErrorMessage(error, "Không thể tải đơn thuốc của lượt khám.") });
                }
            });

        return () => {
            ignore = true;
        };
    }, [medicalRecordId, prescriptionKey]);

    const handleSubmitRecord = useCallback(
        async (markCompleted) => {
            const savedRecord = await submitRecord(markCompleted);

            if (markCompleted && savedRecord?.appointmentId) {
                navigate(
                    `/internal/examinations/${savedRecord.appointmentId}/record`,
                    {
                        replace: true,
                        state: { appointment },
                    }
                );
            }

            return savedRecord;
        },
        [appointment, navigate, submitRecord]
    );

    const handleCompleteExam = useCallback(async () => {
        setCompleteWithoutPrescriptionOpen(false);
        return handleSubmitRecord(true);
    }, [handleSubmitRecord]);

    const handleRequestCompleteExam = useCallback(() => {
        if (checkingPrescription || prescriptionError) return null;
        if (!prescription || prescription.status === "Cancelled") {
            setCompleteWithoutPrescriptionOpen(true);
            return null;
        }

        return handleSubmitRecord(true);
    }, [checkingPrescription, handleSubmitRecord, prescription, prescriptionError]);

    const handleStatusPanelSubmit = useCallback(
        (markCompleted) => {
            if (markCompleted) {
                return handleRequestCompleteExam();
            }

            return handleSubmitRecord(false);
        },
        [handleRequestCompleteExam, handleSubmitRecord]
    );

    const handleCompleteDialogCancel = useCallback(() => {
        setCompleteWithoutPrescriptionOpen(false);
    }, []);

    const openMedicalHistory = () => {
        const draft = createDraft();
        // Preserve unsaved fields in the current entry for both the back button and browser Back.
        navigate(location.pathname, {
            replace: true,
            state: { ...location.state, appointment, medicalRecordDraft: draft },
        });
        navigate(`/internal/examinations/${appointmentId}/history`, {
            state: { examinationReturn: { screen: "edit", appointment, draft } },
        });
    };

    const openPrescription = () => {
        const draft = createDraft();
        navigate(location.pathname, {
            replace: true,
            state: { ...location.state, appointment, medicalRecordDraft: draft },
        });
        navigate(`/internal/examinations/${appointmentId}/prescription`, {
            state: { examinationReturn: { screen: "edit", appointment, draft } },
        });
    };

    if (loading && !appointment) {
        return <Loading />;
    }

    return (
        <>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 3 },
                        border: "1px solid #E5E9F0",
                        borderRadius: 2,
                        bgcolor: "#FFFFFF",
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "minmax(0, 1fr) 220px",
                            },
                            gap: 2,
                            alignItems: "start",
                            width: "100%",
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#005DAC",
                                    fontWeight: 800,
                                }}
                            >
                                Khám bệnh / Hồ sơ bệnh án
                            </Typography>

                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    mt: 1,
                                    color: "#111827",
                                    fontWeight: 900,
                                    lineHeight: 1.18,
                                }}
                            >
                                Lập hồ sơ bệnh án
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    color: "#4B5563",
                                    maxWidth: 760,
                                }}
                            >
                                Ghi nhận triệu chứng, chẩn đoán và kết luận
                                cho lượt khám trước khi chuyển sang các bước
                                chỉ định hoặc kê đơn.
                            </Typography>
                        </Box>

                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                                md: "column",
                            }}
                            spacing={1}
                            sx={{
                                width: { xs: "100%", sm: "auto", md: 220 },
                                flexShrink: 0,
                                justifySelf: { xs: "stretch", md: "end" },
                            }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackRoundedIcon />}
                                onClick={() => navigate("/internal/examinations")}
                                sx={{ minHeight: 42 }}
                            >
                                Quay lại
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<HistoryOutlinedIcon />}
                                disabled={saving || !appointment?.patientBookId}
                                onClick={openMedicalHistory}
                                sx={{ minHeight: 42 }}
                            >
                                Lịch sử khám
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<SaveOutlinedIcon />}
                                disabled={saving || loading || recordConflict}
                                onClick={() => handleSubmitRecord(false)}
                                sx={{ minHeight: 42 }}
                            >
                                Lưu tạm
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<LocalPharmacyOutlinedIcon />}
                                disabled={saving || loading || recordConflict || !medicalRecord}
                                onClick={openPrescription}
                                sx={{ minHeight: 42 }}
                            >
                                Kê đơn thuốc
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleOutlineOutlinedIcon />}
                                disabled={
                                    saving ||
                                    checkingPrescription ||
                                    Boolean(prescriptionError) ||
                                    !completionReady
                                }
                                onClick={handleRequestCompleteExam}
                                sx={{ minHeight: 42 }}
                            >
                                Hoàn tất khám
                            </Button>
                        </Stack>
                    </Box>
                </Paper>

                {loading && appointment && (
                    <Alert severity="info">Đang cập nhật dữ liệu hồ sơ...</Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={reload}
                            >
                                Thử lại
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {actionError && (
                    <Alert severity="error" onClose={recordConflict ? undefined : clearActionError}
                        sx={recordConflict ? {
                            "& .MuiAlert-message": { minWidth: 0 },
                            "& .MuiButton-root": { whiteSpace: "nowrap" },
                            "@media (max-width: 599px)": {
                                flexWrap: "wrap",
                                "& .MuiAlert-message": { flex: 1 },
                                "& .MuiAlert-action": { flexBasis: "100%", margin: 0, padding: "4px 0 0 34px" },
                            },
                        } : undefined}
                        action={recordConflict && <Button color="inherit" size="small" startIcon={<RefreshOutlinedIcon />}
                            disabled={saving || loading} onClick={() => setReloadRecordOpen(true)}>Tải lại hồ sơ</Button>}>
                        {actionError}
                    </Alert>
                )}

                <MedicalRecordPatientSummary
                    appointment={appointment}
                    appointmentId={appointmentId}
                    medicalRecord={medicalRecord}
                />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "minmax(0, 1fr) 360px",
                        },
                        gap: 3,
                        alignItems: "start",
                    }}
                >
                    <Stack sx={{ gap: 3, minWidth: 0 }}>
                        <MedicalRecordFormSections
                            appointment={appointment}
                            form={form}
                            diseases={diseases}
                            updateField={updateField}
                            addDiagnosisRow={addDiagnosisRow}
                            updateDiagnosisRow={updateDiagnosisRow}
                            setPrimaryDiagnosis={setPrimaryDiagnosis}
                            removeDiagnosisRow={removeDiagnosisRow}
                        />
                        <MedicalRecordPaperBookSection key={appointmentId}
                            appointment={appointment} medicalRecord={medicalRecord} form={form}
                            diseases={diseases} selectedDiagnoses={selectedDiagnoses} prescription={prescription}
                            checkingPrescription={checkingPrescription} prescriptionError={prescriptionError}
                            onPrescriptionRetry={retryPrescription} saving={saving || loading || recordConflict} updateField={updateField} />
                    </Stack>

                    <Stack spacing={3} sx={{ minWidth: 0 }}>
                        <MedicalRecordStatusPanel
                            appointment={appointment}
                            diseases={diseases}
                            selectedDiagnoses={selectedDiagnoses}
                            form={form}
                            saving={saving}
                            disabled={loading || recordConflict}
                            completingDisabled={checkingPrescription || Boolean(prescriptionError)}
                            completionReady={completionReady}
                            submitRecord={handleStatusPanelSubmit}
                        />
                        <MedicalRecordPrescriptionPanel
                            prescription={prescription}
                            loading={loading || checkingPrescription}
                            error={prescriptionError}
                            disabled={saving || loading || recordConflict || !medicalRecordId}
                            onOpen={openPrescription}
                        />
                    </Stack>
                </Box>
                {prescriptionError && <Alert severity="error" action={<Button color="inherit" size="small" onClick={retryPrescription}>Thử lại</Button>}>{prescriptionError}</Alert>}
            </Stack>

            <ConfirmDialog
                open={reloadRecordOpen}
                title="Tải lại hồ sơ mới nhất?"
                message="Các thay đổi chưa lưu trên màn hình này sẽ được thay thế bằng hồ sơ mới nhất. Bạn cần đối chiếu lại sổ giấy trước khi chốt lượt."
                confirmText="Tải lại hồ sơ"
                cancelText="Giữ nội dung đang nhập"
                confirmColor="primary"
                loading={loading}
                onCancel={() => setReloadRecordOpen(false)}
                onConfirm={async () => { setReloadRecordOpen(false); await reload(); }}
            />

            <ConfirmDialog
                open={completeWithoutPrescriptionOpen}
                title="Hoàn tất khám không kê đơn?"
                message={
                    medicalRecord?.medicalRecordId
                        ? "Hồ sơ này chưa có đơn thuốc. Bạn muốn hoàn tất lượt khám mà không kê đơn?"
                        : "Hồ sơ này chưa có đơn thuốc. Nếu cần kê đơn, hãy lưu tạm hồ sơ rồi mở kê đơn thuốc trước khi hoàn tất."
                }
                confirmText="Hoàn tất không kê đơn"
                cancelText="Tiếp tục nhập hồ sơ"
                loading={saving}
                onCancel={handleCompleteDialogCancel}
                onConfirm={handleCompleteExam}
            />

            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={3200}
                onClose={clearSuccessMessage}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={clearSuccessMessage}
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </>
    );
}

export default MedicalRecordPage;
