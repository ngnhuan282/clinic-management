import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    getDispensingQueue,
    getDispensingSummary,
} from "../api/dispensingApi";
import getApiErrorMessage from "../utils/errorHandler";
import { readDispensingFilters, writeDispensingFilters } from "../utils/dispensingFilters";
import useAuth from "./useAuth";
import useDispensingAutoRefresh from "./useDispensingAutoRefresh";
import { canKeepDispensingSnapshot } from "../utils/dispensingRefresh";

function normalizeFilters(filters) {
    return {
        ...filters,
        search: filters.search || undefined,
        workflowStatus: filters.workflowStatus || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        reviewStatus: filters.reviewStatus || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
    };
}

function useDispensing() {
    const { userId, sessionRevision } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => readDispensingFilters(searchParams), [searchParams]);
    const [result, setResult] = useState(null);
    const queueSequence = useRef(0);

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const key = JSON.stringify([userId, sessionRevision, requestParams]);
    const current = result?.key === key ? result : null;
    const loadQueue = useCallback(async ({ background = false } = {}) => {
        if (!userId) return;
        const sequence = ++queueSequence.current;
        if (!background) setResult(previous => previous?.key === key ? { ...previous, loading: true } : { key, loading: true });

        try {
            const [queueResult, summaryResult] = await Promise.all([
                getDispensingQueue(requestParams),
                getDispensingSummary(),
            ]);
            if (sequence !== queueSequence.current) return;
            setResult({ key, pagedData: queueResult, summary: summaryResult });
        } catch (err) {
            if (sequence !== queueSequence.current) return;
            const error = getApiErrorMessage(err, "Không tải được danh sách cấp thuốc.");
            setResult(previous => canKeepDispensingSnapshot(previous, key, err)
                ? { ...previous, loading: false, error, stale: true } : { key, error });
        }
    }, [key, requestParams, userId]);

    const refreshInBackground = useCallback(() => loadQueue({ background: true }), [loadQueue]);
    useDispensingAutoRefresh(refreshInBackground, Boolean(userId));

    useEffect(() => {
        const queueRequest = queueSequence;
        // Fetch remote data when queue filters change.
        loadQueue();
        return () => { queueRequest.current++; };
    }, [loadQueue]);

    const updateFilters = useCallback((nextFilters) => {
        setSearchParams((current) => writeDispensingFilters({ ...readDispensingFilters(current), ...nextFilters }), { replace: true });
    }, [setSearchParams]);

    const resetFilters = useCallback(() => {
        setSearchParams({}, { replace: true });
    }, [setSearchParams]);

    return {
        filters,
        queueItems: current?.pagedData?.items || [],
        pagination: current?.pagedData,
        summary: current?.summary,
        loading: Boolean(userId && (!current || current.loading)),
        error: current?.stale ? "" : current?.error || "",
        refreshWarning: current?.stale ? current.error : "",
        updateFilters,
        resetFilters,
        loadQueue,
    };
}

export default useDispensing;
