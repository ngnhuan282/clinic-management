import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createMedicine,
    deleteMedicine,
    getMedicines,
    getMedicineSummary,
    updateMedicine,
} from "../api/medicineApi";
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
    sortBy: "name",
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

function useMedicines() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
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
            categoryResult,
            supplierResult,
        ] = await Promise.all([
            getMedicineCategoryOptions(),
            getSupplierOptions(),
        ]);

        setCategories(categoryResult || []);
        setSuppliers(supplierResult || []);
    }, []);

    const loadMedicines = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [medicineResult, summaryResult] =
                await Promise.all([
                    getMedicines(requestParams),
                    getMedicineSummary(),
                ]);

            setPagedData(medicineResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được danh sách thuốc."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        loadReferenceData().catch((err) => {
            setError(
                getApiErrorMessage(
                    err,
                    "Không tải được dữ liệu danh mục."
                )
            );
        });
    }, [loadReferenceData]);

    useEffect(() => {
        loadMedicines();
    }, [loadMedicines]);

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

    const saveMedicine = useCallback(
        async (payload, medicineId = null) => {
            setSaving(true);

            try {
                if (medicineId) {
                    await updateMedicine(medicineId, payload);
                } else {
                    await createMedicine(payload);
                }

                await loadMedicines();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không lưu được thuốc."
                    )
                );
            } finally {
                setSaving(false);
            }
        },
        [loadMedicines]
    );

    const removeMedicine = useCallback(
        async (medicineId) => {
            setSaving(true);

            try {
                await deleteMedicine(medicineId);
                await loadMedicines();
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(
                        err,
                        "Không xóa được thuốc."
                    )
                );
            } finally {
                setSaving(false);
            }
        },
        [loadMedicines]
    );

    return {
        filters,
        medicines: pagedData?.items || [],
        pagination: pagedData,
        summary,
        categories,
        suppliers,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadMedicines,
        saveMedicine,
        removeMedicine,
    };
}

export default useMedicines;
