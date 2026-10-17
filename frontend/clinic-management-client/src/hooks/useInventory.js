import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    getInventory,
    getInventorySummary,
} from "../api/inventoryApi";
import { getMedicineCategoryOptions } from "../api/medicineCategoryApi";
import { getSupplierOptions } from "../api/supplierApi";
import getApiErrorMessage from "../utils/errorHandler";
import useAuth from "./useAuth";

const DEFAULT_FILTERS = {
    search: "",
    categoryId: "",
    supplierId: "",
    batchNumber: "",
    stockLevel: "",
    expiryStatus: "",
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
        batchNumber: filters.batchNumber.trim() || undefined,
        stockLevel: filters.stockLevel || undefined,
        expiryStatus: filters.expiryStatus || undefined,
        search: filters.search || undefined,
    };
}

function useInventory() {
    const { permissions } = useAuth();
    const canFilterCatalog = permissions.includes("pharmacy.viewCatalog");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const requestSequence = useRef(0);
    const referenceRequest = useRef(null);

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadInventory = useCallback(async () => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError("");

        try {
            if (canFilterCatalog) {
                referenceRequest.current ??= Promise.all([
                    getMedicineCategoryOptions(), getSupplierOptions(),
                ]).catch((err) => {
                    referenceRequest.current = null;
                    throw err;
                });
            }
            const [inventoryResult, summaryResult, [categoryResult, supplierResult]] =
                await Promise.all([
                    getInventory(requestParams),
                    getInventorySummary(),
                    canFilterCatalog ? referenceRequest.current : Promise.resolve([[], []]),
                ]);

            if (sequence !== requestSequence.current) return;
            setPagedData(inventoryResult);
            setSummary(summaryResult);
            setCategories(categoryResult || []);
            setSuppliers(supplierResult || []);
        } catch (err) {
            if (sequence !== requestSequence.current) return;
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh sách tồn kho."
                )
            );
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    }, [requestParams, canFilterCatalog]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadInventory();
        const requests = requestSequence;
        return () => { requests.current++; };
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
        canFilterCatalog,
        loading,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
    };
}

export default useInventory;
