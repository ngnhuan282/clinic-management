import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { getMedicalHistory, getMedicalHistorySummary, getMyMedicalHistory, getMyMedicalHistorySummary } from "../api/medicalHistoryApi";
import getApiErrorMessage from "../utils/errorHandler";

function useMedicalHistory(appointmentId, { patientPortal = false, userId } = {}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { state: navigationState } = useLocation();
    const [summaryResult, setSummaryResult] = useState(null);
    const [historyResult, setHistoryResult] = useState(null);
    const [retry, setRetry] = useState(0);
    const sourceId = patientPortal ? `patient:${userId}` : String(appointmentId);
    const search = searchParams.get("search") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const pageNumber = Math.max(1, Number.parseInt(searchParams.get("pageNumber"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize"), 10) || 10));
    const filters = useMemo(() => ({
        search, fromDate, toDate, pageNumber, pageSize,
    }), [search, fromDate, toDate, pageNumber, pageSize]);
    const dateError = filters.fromDate && filters.toDate && filters.fromDate > filters.toDate
        ? "Ngày bắt đầu không được sau ngày kết thúc."
        : "";
    const requestKey = JSON.stringify([sourceId, filters, retry]);
    const hasSummary = summaryResult?.sourceId === sourceId && summaryResult.retry === retry;

    useEffect(() => {
        const controller = new AbortController();
        const request = patientPortal ? getMyMedicalHistorySummary(controller.signal)
            : getMedicalHistorySummary(sourceId, controller.signal);
        request
            .then((value) => {
                if (!controller.signal.aborted) setSummaryResult({ sourceId, retry, value });
            })
            .catch((error) => {
                if (!controller.signal.aborted) setSummaryResult({ sourceId, retry,
                    error: getApiErrorMessage(error, "Không thể tải thông tin bệnh nhân.") });
            });
        return () => controller.abort();
    }, [sourceId, patientPortal, retry]);

    useEffect(() => {
        if (dateError || !hasSummary || summaryResult.error) return;
        const controller = new AbortController();
        const timer = setTimeout(() => {
            const request = patientPortal ? getMyMedicalHistory(filters, controller.signal)
                : getMedicalHistory(sourceId, filters, controller.signal);
            request
                .then((value) => {
                    if (!controller.signal.aborted) setHistoryResult({ requestKey, value });
                })
                .catch((error) => {
                    if (!controller.signal.aborted) setHistoryResult({ requestKey,
                        error: getApiErrorMessage(error, "Không thể tải lịch sử khám.") });
                });
        }, filters.search ? 250 : 0);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [sourceId, patientPortal, filters, requestKey, dateError, hasSummary, summaryResult]);

    const currentHistory = historyResult?.requestKey === requestKey ? historyResult : null;
    const summaryError = hasSummary ? summaryResult?.error || "" : "";

    const updateFilters = (changes) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            Object.entries(changes).forEach(([key, value]) => {
                if (value === "" || value == null) next.delete(key);
                else next.set(key, String(value));
            });
            return next;
        }, { replace: true, state: navigationState });
    };

    return {
        filters,
        summary: hasSummary ? summaryResult.value : null,
        summaryLoading: !hasSummary,
        summaryError,
        items: currentHistory?.value?.items || [],
        pagination: currentHistory?.value,
        loading: !dateError && !summaryError && !currentHistory,
        error: dateError || currentHistory?.error || "",
        updateFilters,
        resetFilters: () => setSearchParams({}, { replace: true, state: navigationState }),
        reload: () => setRetry((value) => value + 1),
    };
}

export default useMedicalHistory;
