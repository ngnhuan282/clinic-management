import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createDisease,
    deleteDisease,
    getDiseases,
    updateDisease,
} from "../api/diseaseApi";
import getApiErrorMessage from "../utils/errorHandler";

const DEFAULT_FILTERS = {
    search: "",
    status: "",
    pageNumber: 1,
    pageSize: 10,
    sortBy: "name",
    sortOrder: "asc",
};

function normalizeFilters(filters) {
    const params = {
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search || undefined,
        includeInactive: true,
    };

    if (filters.status === "active") {
        params.isActive = true;
    }

    if (filters.status === "inactive") {
        params.isActive = false;
    }

    return params;
}

function useDiseases() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadDiseases = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getDiseases(requestParams);
            setPagedData(result);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh mục bệnh."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        loadDiseases();
    }, [loadDiseases]);

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

    const saveDisease = useCallback(
        async (payload, diseaseId = null) => {
            setSaving(true);

            try {
                if (diseaseId) {
                    await updateDisease(diseaseId, payload);
                } else {
                    await createDisease(payload);
                }

                await loadDiseases();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không lưu được bệnh."
                    ),
                    { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadDiseases]
    );

    const removeDisease = useCallback(
        async (diseaseId) => {
            setSaving(true);

            try {
                await deleteDisease(diseaseId);
                await loadDiseases();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không xóa được bệnh."
                    ),
                    { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadDiseases]
    );

    return {
        filters,
        diseases: pagedData?.items || [],
        pagination: pagedData,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadDiseases,
        saveDisease,
        removeDisease,
    };
}

export default useDiseases;
