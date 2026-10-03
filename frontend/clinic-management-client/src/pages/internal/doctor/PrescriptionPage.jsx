import { useState } from "react";
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
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useNavigate, useParams } from "react-router-dom";

import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import MedicalRecordPatientSummary from "../../../components/internal/examinations/MedicalRecordPatientSummary";
import { normalizeExaminationStatus } from "../../../components/internal/examinations/examinationStatus";
import PrescriptionEditorToolbar from "../../../components/internal/prescriptions/PrescriptionEditorToolbar";
import PrescriptionMedicineTable from "../../../components/internal/prescriptions/PrescriptionMedicineTable";
import PrescriptionSummaryPanel from "../../../components/internal/prescriptions/PrescriptionSummaryPanel";
import usePrescriptionForm from "../../../hooks/usePrescriptionForm";

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    return String(value).slice(0, 5);
}

function getInitials(fullName) {
    const parts = String(fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "BN";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toLocaleUpperCase("vi-VN");
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
        .toLocaleUpperCase("vi-VN");
}

function buildPatientCode(patientId, appointmentId) {
    if (patientId) {
        return `BN-${String(patientId).padStart(5, "0")}`;
    }

    return `LH-${String(appointmentId).padStart(5, "0")}`;
}

function mapRecordToAppointment(record, appointmentId) {
    if (!record) {
        return null;
    }

    return {
        appointmentId: record.appointmentId,
        queueNumber: record.appointmentId || appointmentId,
        time: formatTime(record.startTime),
        status: normalizeExaminationStatus(record.status),
        patientName: record.patientName,
        initials: getInitials(record.patientName),
        avatarColor: "#005DAC",
        patientCode: buildPatientCode(
            record.patientId,
            record.appointmentId
        ),
        phone: record.patientPhone,
        reason: record.reason || "",
    };
}

function PrescriptionPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const {
        medicalRecord,
        prescription,
        medicineOptions,
        form,
        detailSummaries,
        totals,
        loading,
        saving,
        error,
        actionError,
        successMessage,
        loadData,
        updateNotes,
        addMedicine,
        updateDetail,
        removeDetail,
        savePrescription,
        cancelPrescriptionOrder,
        clearActionError,
        clearSuccessMessage,
    } = usePrescriptionForm({ appointmentId });

    const appointment = mapRecordToAppointment(
        medicalRecord,
        appointmentId
    );

    const selectedMedicineIds = form.details.map(
        (detail) => detail.medicineId
    );

    const handleBackToRecord = () => {
        const recordStatus = normalizeExaminationStatus(
            medicalRecord?.status
        );
        const targetPath = recordStatus === "completed"
            ? `/internal/examinations/${appointmentId}/record`
            : `/internal/examinations/${appointmentId}`;

        navigate(targetPath, { state: { appointment } });
    };

    const handleCancelPrescription = async () => {
        setCancelDialogOpen(false);
        await cancelPrescriptionOrder();
    };

    if (loading && !medicalRecord) {
        return <Loading />;
    }

    return (
        <>
            <Stack
                spacing={3}
                sx={{
                    width: {
                        xs: "100%",
                        lg: "calc(100vw - 260px - 48px)",
                    },
                    position: { lg: "relative" },
                    left: { lg: "50%" },
                    transform: { lg: "translateX(-50%)" },
                }}
            >
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
                                Khám bệnh / Hồ sơ bệnh án / Kê đơn thuốc
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
                                Kê đơn thuốc
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    color: "#4B5563",
                                    maxWidth: 760,
                                }}
                            >
                                Lập đơn thuốc từ hồ sơ bệnh án và kiểm tra khả
                                năng đáp ứng tồn kho trước khi lưu đơn.
                            </Typography>
                        </Box>

                        <Stack
                            spacing={1}
                            sx={{
                                width: { xs: "100%", sm: "auto", md: 220 },
                                justifySelf: { xs: "stretch", md: "end" },
                            }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackRoundedIcon />}
                                onClick={handleBackToRecord}
                                sx={{ minHeight: 42 }}
                            >
                                Quay lại hồ sơ
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<SaveOutlinedIcon />}
                                disabled={saving}
                                onClick={savePrescription}
                                sx={{
                                    minHeight: 42,
                                    fontWeight: 800,
                                    boxShadow:
                                        "0 8px 18px rgba(25, 118, 210, 0.18)",
                                }}
                            >
                                Lưu đơn thuốc
                            </Button>

                            {prescription && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelOutlinedIcon />}
                                    disabled={saving}
                                    onClick={() =>
                                        setCancelDialogOpen(true)
                                    }
                                    sx={{ minHeight: 42, fontWeight: 800 }}
                                >
                                    Hủy đơn thuốc
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Paper>

                {loading && medicalRecord && (
                    <Alert severity="info">
                        Đang cập nhật dữ liệu kê đơn...
                    </Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={loadData}
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

                {medicalRecord && (
                    <>
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
                            <Stack spacing={3} sx={{ minWidth: 0 }}>
                                <PrescriptionEditorToolbar
                                    medicineOptions={medicineOptions}
                                    selectedMedicineIds={
                                        selectedMedicineIds
                                    }
                                    disabled={saving}
                                    onAddMedicine={addMedicine}
                                />

                                <PrescriptionMedicineTable
                                    details={detailSummaries}
                                    disabled={saving}
                                    onUpdateDetail={updateDetail}
                                    onRemoveDetail={removeDetail}
                                />
                            </Stack>

                            <PrescriptionSummaryPanel
                                totals={totals}
                                notes={form.notes}
                                disabled={saving}
                                onNotesChange={updateNotes}
                            />
                        </Box>
                    </>
                )}
            </Stack>

            <ConfirmDialog
                open={cancelDialogOpen}
                title="Hủy đơn thuốc?"
                message="Đơn thuốc sẽ được đánh dấu đã hủy và không còn tính là đơn hiện hành của hồ sơ. Tồn kho vẫn không thay đổi."
                confirmText="Hủy đơn thuốc"
                cancelText="Giữ đơn"
                loading={saving}
                onCancel={() => setCancelDialogOpen(false)}
                onConfirm={handleCancelPrescription}
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

export default PrescriptionPage;
