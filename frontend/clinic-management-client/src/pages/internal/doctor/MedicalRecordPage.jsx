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
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getPrescriptionByMedicalRecord } from "../../../api/prescriptionApi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import MedicalRecordFormSections from "../../../components/internal/examinations/MedicalRecordFormSections";
import MedicalRecordPatientSummary from "../../../components/internal/examinations/MedicalRecordPatientSummary";
import MedicalRecordStatusPanel from "../../../components/internal/examinations/MedicalRecordStatusPanel";
import useMedicalRecordForm from "../../../hooks/useMedicalRecordForm";

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
        diseaseSaving,
        error,
        actionError,
        successMessage,
        selectedDiagnoses,
        completionReady,
        updateField,
        addDiagnosisRow,
        updateDiagnosisRow,
        setPrimaryDiagnosis,
        removeDiagnosisRow,
        createDiseaseOption,
        submitRecord,
        reload,
        clearActionError,
        clearSuccessMessage,
    } = useMedicalRecordForm({
        appointmentId,
        initialAppointment,
    });

    const [
        completeWithoutPrescriptionOpen,
        setCompleteWithoutPrescriptionOpen,
    ] = useState(false);
    const [prescription, setPrescription] = useState(null);
    const [checkingPrescription, setCheckingPrescription] = useState(false);

    useEffect(() => {
        let ignore = false;

        if (!medicalRecord?.medicalRecordId) {
            setPrescription(null);
            setCheckingPrescription(false);
            return () => {
                ignore = true;
            };
        }

        setCheckingPrescription(true);
        getPrescriptionByMedicalRecord(medicalRecord.medicalRecordId)
            .then((result) => {
                if (!ignore) {
                    setPrescription(result || null);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setPrescription(null);
                }
            })
            .finally(() => {
                if (!ignore) {
                    setCheckingPrescription(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [medicalRecord?.medicalRecordId]);

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
        if (!prescription) {
            setCompleteWithoutPrescriptionOpen(true);
            return null;
        }

        return handleSubmitRecord(true);
    }, [handleSubmitRecord, prescription]);

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
                                startIcon={<SaveOutlinedIcon />}
                                disabled={saving}
                                onClick={() => handleSubmitRecord(false)}
                                sx={{ minHeight: 42 }}
                            >
                                Lưu tạm
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<LocalPharmacyOutlinedIcon />}
                                disabled={saving || !medicalRecord}
                                onClick={() =>
                                    navigate(
                                        `/internal/examinations/${appointmentId}/prescription`
                                    )
                                }
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
                    <Alert severity="error" onClose={clearActionError}>
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
                    <MedicalRecordFormSections
                        appointment={appointment}
                        medicalRecord={medicalRecord}
                        form={form}
                        diseases={diseases}
                        updateField={updateField}
                        addDiagnosisRow={addDiagnosisRow}
                        updateDiagnosisRow={updateDiagnosisRow}
                        setPrimaryDiagnosis={setPrimaryDiagnosis}
                        removeDiagnosisRow={removeDiagnosisRow}
                        savingDisease={diseaseSaving}
                        onCreateDisease={createDiseaseOption}
                    />

                    <MedicalRecordStatusPanel
                        appointment={appointment}
                        diseases={diseases}
                        selectedDiagnoses={selectedDiagnoses}
                        form={form}
                        saving={saving || checkingPrescription}
                        completionReady={completionReady}
                        submitRecord={handleStatusPanelSubmit}
                    />
                </Box>
            </Stack>

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
