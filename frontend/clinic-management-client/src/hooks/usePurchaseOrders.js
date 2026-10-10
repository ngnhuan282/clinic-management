import { useCallback, useEffect, useMemo, useState } from "react";

import {
    cancelPurchaseOrder,
    createPurchaseOrder,
    getPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderSummary,
    receivePurchaseOrder,
    updatePurchaseOrder,
} from "../api/purchaseOrderApi";
import { getMedicineOptions } from "../api/medicineApi";
import { getSupplierOptions } from "../api/supplierApi";
import getApiErrorMessage from "../utils/errorHandler";

const DEFAULT_FILTERS = {
    search: "",
    supplierId: "",
    status: "",
    fromDate: "",
    toDate: "",
    pageNumber: 1,
    pageSize: 10,
    sortBy: "orderDate",
    sortOrder: "desc",
};

function normalizeFilters(filters) {
    return {
        ...filters,
        search: filters.search || undefined,
        supplierId: filters.supplierId || undefined,
        status: filters.status || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
    };
}

function usePurchaseOrders() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagedData, setPagedData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const requestParams = useMemo(
        () => normalizeFilters(filters),
        [filters]
    );

    const loadReferenceData = useCallback(async () => {
        const [supplierResult, medicineResult] = await Promise.all([
            getSupplierOptions(),
            getMedicineOptions(),
        ]);

        setSuppliers(supplierResult || []);
        setMedicines(medicineResult || []);
    }, []);

    const loadPurchaseOrders = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [orderResult, summaryResult] = await Promise.all([
                getPurchaseOrders(requestParams),
                getPurchaseOrderSummary(),
            ]);

            setPagedData(orderResult);
            setSummary(summaryResult);
        } catch (err) {
            setError(getApiErrorMessage(
                err,
                "Không tải được danh sách phiếu nhập kho."
            ));
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        // Fetch remote data when the page is mounted.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadReferenceData().catch((err) => {
            setError(getApiErrorMessage(
                err,
                "Không tải được dữ liệu thuốc và nhà cung cấp."
            ));
        });
    }, [loadReferenceData]);

    useEffect(() => {
        // Fetch remote data when query inputs change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPurchaseOrders();
    }, [loadPurchaseOrders]);

    const updateFilters = useCallback((nextFilters) => {
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            pageNumber: nextFilters.pageNumber || current.pageNumber,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const runMutation = useCallback(
        async (operation, fallback) => {
            setSaving(true);

            try {
                const result = await operation();
                await loadPurchaseOrders();
                return result;
            } catch (err) {
                throw new Error(
                    getApiErrorMessage(err, fallback),
                    { cause: err }
                );
            } finally {
                setSaving(false);
            }
        },
        [loadPurchaseOrders]
    );

    const savePurchaseOrder = useCallback(
        (payload, purchaseOrderId = null) => runMutation(
            () => purchaseOrderId
                ? updatePurchaseOrder(purchaseOrderId, payload)
                : createPurchaseOrder(payload),
            "Không lưu được phiếu nhập kho."
        ),
        [runMutation]
    );

    const loadPurchaseOrder = useCallback(async (purchaseOrderId) => {
        try {
            return await getPurchaseOrder(purchaseOrderId);
        } catch (err) {
            throw new Error(
                getApiErrorMessage(err, "Không tải được phiếu nhập kho."),
                { cause: err }
            );
        }
    }, []);

    const receiveOrder = useCallback(
        (purchaseOrderId) => runMutation(
            () => receivePurchaseOrder(purchaseOrderId),
            "Không thể xác nhận nhập kho."
        ),
        [runMutation]
    );

    const cancelOrder = useCallback(
        (purchaseOrderId) => runMutation(
            () => cancelPurchaseOrder(purchaseOrderId),
            "Không thể hủy phiếu nhập kho."
        ),
        [runMutation]
    );

    return {
        filters,
        purchaseOrders: pagedData?.items || [],
        pagination: pagedData,
        summary,
        suppliers,
        medicines,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadPurchaseOrders,
        loadPurchaseOrder,
        savePurchaseOrder,
        receiveOrder,
        cancelOrder,
    };
}

export default usePurchaseOrders;
