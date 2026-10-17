import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    getDispensingQueue,
    getDispensingSummary,
} from "../api/dispensingApi";
import getApiErrorMessage from "../utils/errorHandler";
import { readDispensingFilters, writeDispensingFilters } from "../utils/dispensingFilters";

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
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => readDispensingFilters(searchParams), [searchParams]);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const queueSequence = useRef(0);

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadQueue = useCallback(async () => {
        const sequence = ++queueSequence.current;
        setLoading(true);
        setError("");

        try {
            const [queueResult, summaryResult] = await Promise.all([
                getDispensingQueue(requestParams),
                getDispensingSummary(),
            ]);
            if (sequence !== queueSequence.current) return;
            setPagedData(queueResult);
            setSummary(summaryResult);
        } catch (err) {
            if (sequence !== queueSequence.current) return;
            setError(getApiErrorMessage(
                err,
                "Không tải được danh sách cấp thuốc."
            ));
        } finally {
            if (sequence === queueSequence.current) setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        const queueRequest = queueSequence;
        // Fetch remote data when queue filters change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        queueItems: pagedData?.items || [],
        pagination: pagedData,
        summary,
        loading,
        error,
        updateFilters,
        resetFilters,
        loadQueue,
    };
}

export default useDispensing;
