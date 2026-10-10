import { useCallback, useEffect, useMemo, useState } from "react";

import {
    confirmDispensing,
    getDispensingDetail,
    getDispensingQueue,
    getDispensingSummary,
} from "../api/dispensingApi";
import getApiErrorMessage from "../utils/errorHandler";

const DEFAULT_FILTERS = {
    search: "",
    workflowStatus: "",
    fromDate: "",
    toDate: "",
    pageNumber: 1,
    pageSize: 10,
};

function normalizeFilters(filters) {
    return {
        ...filters,
        search: filters.search || undefined,
        workflowStatus: filters.workflowStatus || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
    };
}

function useDispensing() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [queueResult, summaryResult] = await Promise.all([
                getDispensingQueue(requestParams),
                getDispensingSummary(),
            ]);
            setPagedData(queueResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(getApiErrorMessage(
                err,
                "Không tải được danh sách cấp thuốc."
            ));
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        // Fetch remote data when queue filters change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadQueue();
    }, [loadQueue]);

    const updateFilters = useCallback((nextFilters) => {
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            pageNumber: nextFilters.pageNumber ?? current.pageNumber,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const loadDetail = useCallback(async (prescriptionId) => {
        setDetailLoading(true);

        try {
            const result = await getDispensingDetail(prescriptionId);
            setDetail(result);
            return result;
        } catch (err) {
            throw new Error(
                getApiErrorMessage(err, "Không tải được chi tiết cấp thuốc."),
                { cause: err }
            );
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const clearDetail = useCallback(() => setDetail(null), []);

    const dispense = useCallback(async (prescriptionId) => {
        setConfirming(true);

        try {
            const result = await confirmDispensing(prescriptionId);
            setDetail(result);
            await loadQueue();
            return result;
        } catch (err) {
            throw new Error(
                getApiErrorMessage(err, "Không thể xác nhận giao thuốc."),
                { cause: err }
            );
        } finally {
            setConfirming(false);
        }
    }, [loadQueue]);

    return {
        filters,
        queueItems: pagedData?.items || [],
        pagination: pagedData,
        summary,
        detail,
        loading,
        detailLoading,
        confirming,
        error,
        updateFilters,
        resetFilters,
        loadQueue,
        loadDetail,
        clearDetail,
        dispense,
    };
}

export default useDispensing;
