import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createAppointment,
    getAvailableSlots,
    getDepartments,
    getDoctorsByDepartment,
} from "../api/bookingApi";
import getApiErrorMessage from "../utils/errorHandler";

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

export function useBooking() {
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [patientName, setPatientName] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState({
        departments: false,
        doctors: false,
        slots: false,
        submitting: false,
    });
    const [error, setError] = useState("");
    const [successAppointment, setSuccessAppointment] = useState(null);

    const selectedDepartment = useMemo(
        () =>
            departments.find(
                (item) =>
                    item.departmentId ===
                    Number(selectedDepartmentId)
            ),
        [departments, selectedDepartmentId]
    );

    const selectedDoctor = useMemo(
        () =>
            doctors.find(
                (item) =>
                    item.doctorId === Number(selectedDoctorId)
            ),
        [doctors, selectedDoctorId]
    );

    useEffect(() => {
        let mounted = true;

        async function fetchDepartments() {
            setLoading((prev) => ({
                ...prev,
                departments: true,
            }));

            try {
                const result = await getDepartments();

                if (mounted) {
                    setDepartments(result || []);
                }
            } catch (apiError) {
                if (mounted) {
                    setError(getApiErrorMessage(apiError));
                }
            } finally {
                if (mounted) {
                    setLoading((prev) => ({
                        ...prev,
                        departments: false,
                    }));
                }
            }
        }

        fetchDepartments();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function fetchDoctors() {
            if (!selectedDepartmentId) {
                setDoctors([]);
                setSelectedDoctorId("");
                return;
            }

            setLoading((prev) => ({
                ...prev,
                doctors: true,
            }));
            setError("");
            setSelectedDoctorId("");
            setSelectedSlot(null);
            setSlots([]);

            try {
                const result = await getDoctorsByDepartment(
                    selectedDepartmentId
                );

                if (mounted) {
                    setDoctors(result || []);
                }
            } catch (apiError) {
                if (mounted) {
                    setError(getApiErrorMessage(apiError));
                }
            } finally {
                if (mounted) {
                    setLoading((prev) => ({
                        ...prev,
                        doctors: false,
                    }));
                }
            }
        }

        fetchDoctors();

        return () => {
            mounted = false;
        };
    }, [selectedDepartmentId]);

    const refreshSlots = useCallback(async () => {
        if (!selectedDoctorId || !selectedDate) {
            setSlots([]);
            return;
        }

        setLoading((prev) => ({
            ...prev,
            slots: true,
        }));
        setError("");
        setSelectedSlot(null);

        try {
            const result = await getAvailableSlots(
                selectedDoctorId,
                selectedDate
            );

            setSlots(result || []);
        } catch (apiError) {
            setError(getApiErrorMessage(apiError));
        } finally {
            setLoading((prev) => ({
                ...prev,
                slots: false,
            }));
        }
    }, [selectedDate, selectedDoctorId]);

    useEffect(() => {
        refreshSlots();
    }, [refreshSlots]);

    const submitBooking = useCallback(async () => {
        if (
            !selectedDoctorId ||
            !selectedDate ||
            !selectedSlot ||
            !patientName.trim() ||
            !patientPhone.trim() ||
            !reason.trim()
        ) {
            setError("Vui lòng điền đầy đủ thông tin đặt lịch.");
            return;
        }

        setLoading((prev) => ({
            ...prev,
            submitting: true,
        }));
        setError("");
        setSuccessAppointment(null);

        try {
            const result = await createAppointment({
                doctorId: Number(selectedDoctorId),
                appointmentDate: selectedDate,
                startTime: selectedSlot.startTime,
                patientName,
                patientPhone,
                reason,
            });

            setSuccessAppointment(result);
            await refreshSlots();
        } catch (apiError) {
            setError(getApiErrorMessage(apiError));
            await refreshSlots();
        } finally {
            setLoading((prev) => ({
                ...prev,
                submitting: false,
            }));
        }
    }, [
        patientName,
        patientPhone,
        reason,
        refreshSlots,
        selectedDate,
        selectedDoctorId,
        selectedSlot,
    ]);

    return {
        departments,
        doctors,
        slots,
        selectedDepartment,
        selectedDepartmentId,
        selectedDoctor,
        selectedDoctorId,
        selectedDate,
        selectedSlot,
        patientName,
        patientPhone,
        reason,
        loading,
        error,
        successAppointment,
        setSelectedDepartmentId,
        setSelectedDoctorId,
        setSelectedDate,
        setSelectedSlot,
        setPatientName,
        setPatientPhone,
        setReason,
        submitBooking,
    };
}

export default useBooking;
