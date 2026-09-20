import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createMedicineCategory,
    deleteMedicineCategory,
    getMedicineCategories,
    getMedicineCategorySummary,
    updateMedicineCategory,
} from "../api/medicineCategoryApi";
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

function useMedicineCategories() {
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

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [categoryResult, summaryResult] =
                await Promise.all([
                    getMedicineCategories(requestParams),
                    getMedicineCategorySummary(),
                ]);

            setPagedData(categoryResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh mục thuốc."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCategories();
    }, [loadCategories]);

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

    const saveCategory = useCallback(
        async (payload, categoryId = null) => {
            setSaving(true);

            try {
                if (categoryId) {
                    await updateMedicineCategory(
                        categoryId,
                        payload
                    );
                } else {
                    await createMedicineCategory(payload);
                }

                await loadCategories();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không lưu được danh mục thuốc."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadCategories]
    );

    const removeCategory = useCallback(
        async (categoryId) => {
            setSaving(true);

            try {
                await deleteMedicineCategory(categoryId);
                await loadCategories();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không xóa được danh mục thuốc."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadCategories]
    );

    return {
        filters,
        categories: pagedData?.items || [],
        pagination: pagedData,
        summary,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadCategories,
        saveCategory,
        removeCategory,
    };
}

export default useMedicineCategories;
