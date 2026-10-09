import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getInventory,
    getInventorySummary,
} from "../api/inventoryApi";
import { getMedicineCategoryOptions } from "../api/medicineCategoryApi";
import { getSupplierOptions } from "../api/supplierApi";
import getApiErrorMessage from "../utils/errorHandler";

const DEFAULT_FILTERS = {
    search: "",
    categoryId: "",
    supplierId: "",
    stockStatus: "",
    pageNumber: 1,
    pageSize: 10,
    sortBy: "expiry",
    sortOrder: "asc",
};

function normalizeFilters(filters) {
    return {
        ...filters,
        categoryId: filters.categoryId || undefined,
        supplierId: filters.supplierId || undefined,
        stockStatus: filters.stockStatus || undefined,
        search: filters.search || undefined,
    };
}

function useInventory() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadReferenceData = useCallback(async () => {
        const [
            categoryResult,
            supplierResult,
        ] = await Promise.all([
            getMedicineCategoryOptions(),
            getSupplierOptions(),
        ]);

        setCategories(categoryResult || []);
        setSuppliers(supplierResult || []);
    }, []);

    const loadInventory = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [inventoryResult, summaryResult] =
                await Promise.all([
                    getInventory(requestParams),
                    getInventorySummary(),
                ]);

            setPagedData(inventoryResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh sách tồn kho."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadReferenceData().catch((err) => {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được dữ liệu thuốc."
                )
            );
        });
    }, [loadReferenceData]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadInventory();
    }, [loadInventory]);

    const updateFilters = useCallback((nextFilters) => {
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            pageNumber: nextFilters.pageNumber ||
                current.pageNumber,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    return {
        filters,
        inventoryItems: pagedData?.items || [],
        pagination: pagedData,
        summary,
        categories,
        suppliers,
        loading,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
    };
}

export default useInventory;
