import { useCallback, useEffect, useRef, useState } from "react";
import { confirmDispensing, getDispensingDetail, requestStockReview, recheckStockReview } from "../api/dispensingApi";
import getApiErrorMessage from "../utils/errorHandler";
import { buildStockReviewRecheckRequest } from "../utils/stockReviewWorkflow";

function useDispensingDetail(prescriptionId, userId) {
    const key = JSON.stringify([userId, prescriptionId]);
    const [result, setResult] = useState(null);
    const [mutation, setMutation] = useState(null);
    const sequence = useRef(0);
    const current = result?.key === key ? result : null;

    const reload = useCallback(async () => {
        if (!prescriptionId || !userId) return;
        const request = ++sequence.current;
        setResult({ key, loading: true });
        try {
            const value = await getDispensingDetail(prescriptionId);
            if (request === sequence.current) setResult({ key, value });
        } catch (err) {
            const error = getApiErrorMessage(err, "Không tải được chi tiết cấp thuốc.");
            if (request === sequence.current) setResult({ key, error });
            throw new Error(error, { cause: err });
        }
    }, [key, prescriptionId, userId]);

    useEffect(() => {
        const activeSequence = sequence;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        reload().catch(() => {});
        return () => { activeSequence.current++; };
    }, [reload]);

    const performMutation = useCallback(async (type, action, fallback) => {
        const request = ++sequence.current;
        setMutation({ key, type });
        try {
            const value = await action();
            if (request === sequence.current) setResult({ key, value });
            return value;
        } catch (err) {
            throw new Error(getApiErrorMessage(err, fallback), { cause: err });
        } finally {
            if (request === sequence.current) setMutation(null);
        }
    }, [key]);

    return {
        detail: current?.value,
        loading: Boolean(prescriptionId && userId && (!current || current.loading)),
        error: current?.error || "",
        confirming: mutation?.key === key && mutation.type === "dispense",
        reviewing: mutation?.key === key && mutation.type === "review",
        reload,
        dispense: () => performMutation("dispense", () => confirmDispensing(prescriptionId), "Không thể xác nhận giao thuốc."),
        processReview: (request) => performMutation("review", () => request ? requestStockReview(prescriptionId, request)
            : recheckStockReview(prescriptionId, buildStockReviewRecheckRequest(current?.value || {})), "Không thể xử lý yêu cầu rà soát."),
    };
}

export default useDispensingDetail;
