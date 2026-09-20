import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createSupplier,
    deleteSupplier,
    getSuppliers,
    getSupplierSummary,
    updateSupplier,
} from "../api/supplierApi";
import getApiErrorMessage from "../utils/errorHandler";

const DEFAULT_FILTERS = {
    search: "",
    usageStatus: "",
    pageNumber: 1,
    pageSize: 10,
    sortBy: "name",
    sortOrder: "asc",
};

function normalizeFilters(filters) {
    return {
        ...filters,
        search: filters.search || undefined,
        usageStatus: filters.usageStatus || undefined,
    };
}

function useSuppliers() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [supplierResult, summaryResult] =
                await Promise.all([
                    getSuppliers(requestParams),
                    getSupplierSummary(),
                ]);

            setPagedData(supplierResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh sách nhà cung cấp."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSuppliers();
    }, [loadSuppliers]);

    const updateFilters = useCallback((nextFilters) => {
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            pageNumber:
                nextFilters.pageNumber || current.pageNumber,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const saveSupplier = useCallback(
        async (payload, supplierId = null) => {
            setSaving(true);

            try {
                if (supplierId) {
                    await updateSupplier(supplierId, payload);
                } else {
                    await createSupplier(payload);
                }

                await loadSuppliers();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không lưu được nhà cung cấp."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadSuppliers]
    );

    const removeSupplier = useCallback(
        async (supplierId) => {
            setSaving(true);

            try {
                await deleteSupplier(supplierId);
                await loadSuppliers();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không xóa được nhà cung cấp."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadSuppliers]
    );

    return {
        filters,
        suppliers: pagedData?.items || [],
        pagination: pagedData,
        summary,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadSuppliers,
        saveSupplier,
        removeSupplier,
    };
}

export default useSuppliers;
