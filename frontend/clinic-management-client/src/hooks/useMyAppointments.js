import { useEffect, useState } from "react";
import { getMyAppointments } from "../api/patientAppointmentApi";
import useAuth from "./useAuth";
import useNotifications from "./useNotifications";
import getApiErrorMessage from "../utils/errorHandler";

const initialFilters = { dateFrom: "", dateTo: "", status: "", pageNumber: 1 };

export default function useMyAppointments() {
    const { userId } = useAuth();
    const { revision } = useNotifications();
    const [filters, setFilters] = useState(initialFilters);
    const [reload, setReload] = useState(0);
    const [result, setResult] = useState(null);
    const { dateFrom, dateTo, status, pageNumber } = filters;
    const dateError = dateFrom && dateTo && dateFrom > dateTo
        ? "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu." : "";
    const key = JSON.stringify([userId, dateFrom, dateTo, status, pageNumber, revision, reload]);

    useEffect(() => {
        if (!userId || dateError) return;
        const controller = new AbortController();
        getMyAppointments({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
            status: status || undefined, pageNumber, pageSize: 10 }, controller.signal)
            .then(data => {
                if (controller.signal.aborted) return;
                const lastPage = Math.max(1, data.totalPages);
                if (pageNumber > lastPage) {
                    setFilters(current => ({ ...current, pageNumber: lastPage }));
                    return;
                }
                setResult({ key, data });
            })
            .catch(error => {
                if (!controller.signal.aborted)
                    setResult({ key, error: getApiErrorMessage(error, "Không thể tải lịch hẹn của bạn.") });
            });
        return () => controller.abort();
    }, [userId, dateFrom, dateTo, status, pageNumber, dateError, key]);

    const current = result?.key === key ? result : null;
    return {
        filters, dateError, data: current?.data, error: current?.error,
        loading: Boolean(userId) && !dateError && !current,
        setFilter: (field, value) => setFilters(current => ({ ...current, [field]: value, pageNumber: 1 })),
        setPageNumber: value => setFilters(current => ({ ...current, pageNumber: value })),
        resetFilters: () => setFilters(initialFilters),
        refresh: () => setReload(value => value + 1),
    };
}
