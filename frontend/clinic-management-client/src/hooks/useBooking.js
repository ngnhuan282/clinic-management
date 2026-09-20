import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    createAppointment,
    getAvailableSlots,
    getDepartments,
    getDoctorsByDepartment,
} from "../api/bookingApi";
import getApiErrorMessage from "../utils/errorHandler";

export function useBooking() {
    const slotRequest = useRef(0);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
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

    const resetForm = useCallback(() => {
        setDoctors([]);
        setSlots([]);
        setSelectedDepartmentId("");
        setSelectedDoctorId("");
        setSelectedDate("");
        setSelectedSlot(null);
        setPatientName("");
        setPatientPhone("");
        setReason("");
    }, []);

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
        const requestId = ++slotRequest.current;
        setSelectedSlot(null);
        setSlots([]);
        if (!selectedDoctorId || !selectedDate) {
            setLoading(prev => ({ ...prev, slots: false }));
            return;
        }

        setLoading((prev) => ({
            ...prev,
            slots: true,
        }));
        setSelectedSlot(null);

        try {
            const result = await getAvailableSlots(
                selectedDoctorId,
                selectedDate
            );

            if (requestId === slotRequest.current) setSlots(result || []);
        } catch (apiError) {
            if (requestId === slotRequest.current) setError(getApiErrorMessage(apiError));
        } finally {
            if (requestId === slotRequest.current) setLoading((prev) => ({
                ...prev,
                slots: false,
            }));
        }
    }, [selectedDate, selectedDoctorId]);

    useEffect(() => {
        // Synchronize availability with the selected doctor/date and cancel stale results.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshSlots();
        const requestId = slotRequest.current;
        return () => { slotRequest.current = requestId + 1; };
    }, [refreshSlots]);

    const submitBooking = useCallback(async () => {
        if (
            loading.slots || loading.submitting || !selectedDoctorId ||
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
            resetForm();
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
        loading.slots,
        loading.submitting,
        patientPhone,
        reason,
        refreshSlots,
        resetForm,
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
        resetForm,
        submitBooking,
    };
}

export default useBooking;
