import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createInventory,
    deleteInventory,
    getInventory,
    getInventorySummary,
    updateInventory,
} from "../api/inventoryApi";
import { getMedicineCategoryOptions } from "../api/medicineCategoryApi";
import { getMedicineOptions } from "../api/medicineApi";
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
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadReferenceData = useCallback(async () => {
        const [
            medicineResult,
            categoryResult,
            supplierResult,
        ] = await Promise.all([
            getMedicineOptions(),
            getMedicineCategoryOptions(),
            getSupplierOptions(),
        ]);

        setMedicines(medicineResult || []);
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

    const saveInventory = useCallback(
        async (payload, inventoryId = null) => {
            setSaving(true);

            try {
                if (inventoryId) {
                    await updateInventory(inventoryId, payload);
                } else {
                    await createInventory(payload);
                }

                await loadInventory();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không lưu được lô tồn kho."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadInventory]
    );

    const removeInventory = useCallback(
        async (inventoryId) => {
            setSaving(true);

            try {
                await deleteInventory(inventoryId);
                await loadInventory();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không xóa được lô tồn kho."
                    ), { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadInventory]
    );

    return {
        filters,
        inventoryItems: pagedData?.items || [],
        pagination: pagedData,
        summary,
        medicines,
        categories,
        suppliers,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
        saveInventory,
        removeInventory,
    };
}

export default useInventory;
