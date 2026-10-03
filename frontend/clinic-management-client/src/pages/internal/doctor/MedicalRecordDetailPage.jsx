import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Loading from "../../../components/common/Loading";
import MedicalRecordAuditPanel from "../../../components/internal/examinations/MedicalRecordAuditPanel";
import MedicalRecordPatientSummary from "../../../components/internal/examinations/MedicalRecordPatientSummary";
import MedicalRecordReadOnlySections from "../../../components/internal/examinations/MedicalRecordReadOnlySections";
import MedicalRecordPrescriptionPanel from "../../../components/internal/prescriptions/MedicalRecordPrescriptionPanel";
import { getMedicalRecordByAppointment } from "../../../api/examinationApi";
import { getPrescriptionByMedicalRecord } from "../../../api/prescriptionApi";
import getApiErrorMessage from "../../../utils/errorHandler";
import { normalizeExaminationStatus } from "../../../components/internal/examinations/examinationStatus";

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

function mapRecordToAppointment(record, fallbackAppointment = null) {
    return {
        ...fallbackAppointment,
        appointmentId: record.appointmentId,
        queueNumber:
            fallbackAppointment?.queueNumber || record.appointmentId,
        time: fallbackAppointment?.time || formatTime(record.startTime),
        status: normalizeExaminationStatus(record.status),
        patientName: record.patientName,
        initials: getInitials(record.patientName),
        avatarColor: fallbackAppointment?.avatarColor || "#005DAC",
        avatarTextColor: fallbackAppointment?.avatarTextColor,
        patientCode: buildPatientCode(
            record.patientId,
            record.appointmentId
        ),
        phone: record.patientPhone,
        reason: fallbackAppointment?.reason || "",
    };
}

function MedicalRecordDetailPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const initialAppointment = useMemo(
        () => location.state?.appointment || null,
        [location.state]
    );
    const [record, setRecord] = useState(null);
    const [appointment, setAppointment] = useState(initialAppointment);
    const [prescription, setPrescription] = useState(null);
    const [prescriptionLoading, setPrescriptionLoading] = useState(false);
    const [prescriptionError, setPrescriptionError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecord = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result =
                await getMedicalRecordByAppointment(appointmentId);
            setRecord(result);
            setAppointment(
                mapRecordToAppointment(result, initialAppointment)
            );

            setPrescriptionLoading(true);
            setPrescriptionError("");
            setPrescription(null);

            try {
                const loadedPrescription =
                    await getPrescriptionByMedicalRecord(
                        result.medicalRecordId
                    );
                setPrescription(loadedPrescription || null);
            } catch (prescriptionErr) {
                setPrescriptionError(
                    getApiErrorMessage(
                        prescriptionErr,
                        "Không thể tải đơn thuốc."
                    )
                );
            } finally {
                setPrescriptionLoading(false);
            }
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không thể tải hồ sơ bệnh án."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [appointmentId, initialAppointment]);

    useEffect(() => {
        const timer = setTimeout(() => { void loadRecord(); }, 0);
        return () => clearTimeout(timer);
    }, [loadRecord]);

    if (loading && !record) {
        return <Loading />;
    }

    return (
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
                            Chi tiết hồ sơ bệnh án
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 1,
                                color: "#4B5563",
                                maxWidth: 760,
                            }}
                        >
                            Xem lại triệu chứng, chẩn đoán và kết luận
                            đã ghi nhận cho lượt khám.
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
                            onClick={() => navigate("/internal/examinations")}
                            sx={{ minHeight: 42 }}
                        >
                            Quay lại
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<EditNoteOutlinedIcon />}
                            onClick={() =>
                                navigate(
                                    `/internal/examinations/${appointmentId}`,
                                    { state: { appointment } }
                                )
                            }
                            sx={{ minHeight: 42 }}
                        >
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<LocalPharmacyOutlinedIcon />}
                            disabled={!record}
                            onClick={() =>
                                navigate(
                                    `/internal/examinations/${appointmentId}/prescription`
                                )
                            }
                            sx={{ minHeight: 42 }}
                        >
                            Kê đơn thuốc
                        </Button>
                    </Stack>
                </Box>
            </Paper>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={loadRecord}
                        >
                            Thử lại
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {record && (
                <>
                    <MedicalRecordPatientSummary
                        appointment={appointment}
                        appointmentId={appointmentId}
                        medicalRecord={record}
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
                        <MedicalRecordReadOnlySections record={record} />

                        <Stack spacing={3}>
                            <MedicalRecordAuditPanel record={record} />

                            <MedicalRecordPrescriptionPanel
                                prescription={prescription}
                                loading={prescriptionLoading}
                                error={prescriptionError}
                                onOpen={() =>
                                    navigate(
                                        `/internal/examinations/${appointmentId}/prescription`
                                    )
                                }
                            />
                        </Stack>
                    </Box>
                </>
            )}
        </Stack>
    );
}

export default MedicalRecordDetailPage;
