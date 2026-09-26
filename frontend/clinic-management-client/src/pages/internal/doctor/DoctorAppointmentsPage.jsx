import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import DoctorQueueFilters from "../../../components/internal/examinations/DoctorQueueFilters";
import DoctorQueueStatCards from "../../../components/internal/examinations/DoctorQueueStatCards";
import DoctorQueueTable from "../../../components/internal/examinations/DoctorQueueTable";
import EmptyState from "../../../components/common/EmptyState";
import useAuth from "../../../hooks/useAuth";
import {
    getExaminationQueue,
    startExamination,
} from "../../../api/examinationApi";
import { normalizeExaminationStatus } from "../../../components/internal/examinations/examinationStatus";
import getApiErrorMessage from "../../../utils/errorHandler";

const DEFAULT_FILTERS = {
    date: new Date(),
    search: "",
    shift: "all",
    status: "",
    pageNumber: 1,
    pageSize: 7,
};

function normalizeText(value) {
    return String(value || "")
        .toLocaleLowerCase("vi-VN")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatDateParam(value) {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isSameCalendarDate(left, right) {
    const leftDate = left instanceof Date ? left : new Date(left);
    const rightDate = right instanceof Date ? right : new Date(right);

    if (
        Number.isNaN(leftDate.getTime()) ||
        Number.isNaN(rightDate.getTime())
    ) {
        return false;
    }

    return leftDate.getFullYear() === rightDate.getFullYear() &&
        leftDate.getMonth() === rightDate.getMonth() &&
        leftDate.getDate() === rightDate.getDate();
}

function isToday(value) {
    return isSameCalendarDate(value, new Date());
}

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    return String(value).slice(0, 5);
}

function getShiftFromTime(value) {
    const hour = Number(formatTime(value).split(":")[0]);

    if (Number.isNaN(hour)) {
        return "morning";
    }

    return hour < 12 ? "morning" : "afternoon";
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

function mapQueueAppointment(item) {
    return {
        appointmentId: item.appointmentId,
        queueNumber: item.appointmentId,
        appointmentDate: item.appointmentDate,
        canStartExamination: isToday(item.appointmentDate),
        time: formatTime(item.startTime),
        shift: getShiftFromTime(item.startTime),
        status: normalizeExaminationStatus(item.status),
        patientName: item.patientName,
        initials: getInitials(item.patientName),
        avatarColor: "#005DAC",
        patientCode: buildPatientCode(
            item.patientId,
            item.appointmentId
        ),
        phone: item.patientPhone,
        reason: item.reason,
    };
}

function getErrorMessage(error) {
    return getApiErrorMessage(
        error,
        "Không thể tải lịch khám từ máy chủ."
    );
}

function buildSummary(appointments) {
    return appointments.reduce(
        (summary, appointment) => {
            const status = normalizeExaminationStatus(
                appointment.status
            );

            summary.total += 1;

            if (status === "waiting" || status === "priority") {
                summary.waiting += 1;
            }

            if (status === "inProgress") {
                summary.inProgress += 1;
            }

            if (status === "completed") {
                summary.completed += 1;
            }

            return summary;
        },
        {
            total: 0,
            waiting: 0,
            inProgress: 0,
            completed: 0,
            absent: 0,
        }
    );
}

function DoctorAppointmentsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [queueError, setQueueError] = useState("");
    const [startingAppointmentId, setStartingAppointmentId] =
        useState(null);

    const doctorName =
        user?.fullName || "BSCKII. Nguyễn Thanh Hùng";

    useEffect(() => {
        let isActive = true;

        async function loadQueue() {
            setLoading(true);
            setQueueError("");

            try {
                const result = await getExaminationQueue({
                    date: formatDateParam(filters.date),
                    search: filters.search || undefined,
                    shift: filters.shift,
                    pageNumber: 1,
                    pageSize: 200,
                });

                if (!isActive) {
                    return;
                }

                setAppointments(
                    (result.items || []).map(mapQueueAppointment)
                );
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setAppointments([]);
                setQueueError(getErrorMessage(error));
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        loadQueue();

        return () => {
            isActive = false;
        };
    }, [
        filters.date,
        filters.search,
        filters.shift,
    ]);

    const filteredAppointments = useMemo(() => {
        const search = normalizeText(filters.search.trim());

        return appointments.filter((appointment) => {
            const matchesSearch = !search ||
                normalizeText(
                    [
                        appointment.patientName,
                        appointment.patientCode,
                        appointment.phone,
                        `STT ${appointment.queueNumber}`,
                    ].join(" ")
                ).includes(search);
            const matchesShift =
                filters.shift === "all" ||
                appointment.shift === filters.shift;
            const matchesStatus =
                !filters.status ||
                appointment.status === filters.status;

            return matchesSearch && matchesShift && matchesStatus;
        });
    }, [appointments, filters]);

    const summary = useMemo(
        () => buildSummary(appointments),
        [appointments]
    );

    const pagedAppointments = useMemo(() => {
        const start =
            (filters.pageNumber - 1) * filters.pageSize;

        return filteredAppointments.slice(
            start,
            start + filters.pageSize
        );
    }, [
        filteredAppointments,
        filters.pageNumber,
        filters.pageSize,
    ]);

    const updateFilters = (nextFilters) => {
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            pageNumber: nextFilters.pageNumber || 1,
        }));
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleClinicalAction = async (appointment) => {
        const normalizedStatus = normalizeExaminationStatus(
            appointment.status
        );

        if (normalizedStatus === "completed") {
            navigate(
                `/internal/examinations/${appointment.appointmentId}/record`,
                { state: { appointment } }
            );

            return;
        }

        let selectedAppointment = appointment;

        if (
            normalizedStatus === "waiting" ||
            normalizedStatus === "priority"
        ) {
            if (appointment.canStartExamination === false) {
                setQueueError(
                    "Chỉ có thể bắt đầu khám cho lịch hẹn hôm nay."
                );
                return;
            }

            setQueueError("");
            setStartingAppointmentId(appointment.appointmentId);

            try {
                const startedAppointment =
                    await startExamination(
                        appointment.appointmentId
                    );
                const nextStatus = normalizeExaminationStatus(
                    startedAppointment.status
                );

                selectedAppointment = {
                    ...appointment,
                    status: nextStatus,
                };

                setAppointments((current) =>
                    current.map((item) =>
                        item.appointmentId === appointment.appointmentId
                            ? {
                                ...item,
                                status: nextStatus,
                            }
                            : item
                    )
                );
            } catch (error) {
                setQueueError(getErrorMessage(error));
                return;
            } finally {
                setStartingAppointmentId(null);
            }
        }

        navigate(
            `/internal/examinations/${appointment.appointmentId}`,
            { state: { appointment: selectedAppointment } }
        );
    };

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 800 }}
                        >
                            Bác sĩ điều trị / Khoa Khám Bệnh /
                        </Typography>

                        <Typography
                            variant="caption"
                            color="primary"
                            sx={{ fontWeight: 900 }}
                        >
                            Lịch khám hôm nay
                        </Typography>
                    </Stack>

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            mt: 1.25,
                            color: "#111827",
                            fontWeight: 900,
                        }}
                    >
                        Khám bệnh - Lịch khám hôm nay
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, maxWidth: 820, lineHeight: 1.7 }}
                    >
                        Theo dõi danh sách lượt khám trong ngày của{" "}
                        <Box
                            component="span"
                            sx={{
                                color: "#374151",
                                fontWeight: 800,
                            }}
                        >
                            {doctorName}
                        </Box>
                        . Bác sĩ mở lượt khám để ghi triệu chứng,
                        chẩn đoán và kết luận.
                    </Typography>
                </Box>
            </Paper>

            <DoctorQueueStatCards stats={summary} />

            <DoctorQueueFilters
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
            />

            {queueError && (
                <Alert severity="error">
                    {queueError}
                </Alert>
            )}

            {loading ? (
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid #E5E9F0",
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    <EmptyState message="Đang tải lịch khám..." />
                </Paper>
            ) : filteredAppointments.length ? (
                <DoctorQueueTable
                    appointments={pagedAppointments}
                    pagination={{
                        pageNumber: filters.pageNumber,
                        pageSize: filters.pageSize,
                        totalItems: filteredAppointments.length,
                    }}
                    onPageChange={(pageNumber) =>
                        updateFilters({ pageNumber })
                    }
                    onPageSizeChange={(pageSize) =>
                        updateFilters({
                            pageSize,
                            pageNumber: 1,
                        })
                    }
                    onClinicalAction={handleClinicalAction}
                    clinicalActionLoadingId={startingAppointmentId}
                />
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid #E5E9F0",
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    <EmptyState message="Không có lượt khám phù hợp với bộ lọc hiện tại." />
                </Paper>
            )}
        </Stack>
    );
}

export default DoctorAppointmentsPage;
