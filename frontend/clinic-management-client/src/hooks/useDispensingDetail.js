import { useCallback, useEffect, useRef, useState } from "react";
import { confirmDispensing, getDispensingDetail, requestStockReview, recheckStockReview } from "../api/dispensingApi";
import getApiErrorMessage from "../utils/errorHandler";
import { buildStockReviewRecheckRequest } from "../utils/stockReviewWorkflow";
import useDispensingAutoRefresh from "./useDispensingAutoRefresh";
import { canKeepDispensingSnapshot } from "../utils/dispensingRefresh";

function useDispensingDetail(prescriptionId, userId, autoRefresh = true) {
    const key = JSON.stringify([userId, prescriptionId]);
    const [result, setResult] = useState(null);
    const [mutation, setMutation] = useState(null);
    const sequence = useRef(0);
    const mutating = useRef(null);
    const current = result?.key === key ? result : null;

    const reload = useCallback(async ({ background = false } = {}) => {
        if (!prescriptionId || !userId || mutating.current?.key === key) return;
        const request = ++sequence.current;
        if (!background) setResult(previous => previous?.key === key ? { ...previous, loading: true } : { key, loading: true });
        try {
            const value = await getDispensingDetail(prescriptionId);
            if (request === sequence.current) setResult({ key, value });
        } catch (err) {
            const error = getApiErrorMessage(err, "Không tải được chi tiết cấp thuốc.");
            if (request === sequence.current) setResult(previous => canKeepDispensingSnapshot(previous, key, err)
                ? { ...previous, loading: false, error, stale: true } : { key, error });
            throw new Error(error, { cause: err });
        }
    }, [key, prescriptionId, userId]);

    const refreshInBackground = useCallback(() => reload({ background: true }).catch(() => {}), [reload]);
    useDispensingAutoRefresh(refreshInBackground, autoRefresh && Boolean(prescriptionId && userId) && mutation?.key !== key);

    useEffect(() => {
        const activeSequence = sequence;
        reload().catch(() => {});
        return () => { activeSequence.current++; };
    }, [reload]);

    const performMutation = useCallback(async (type, action, fallback) => {
        if (current?.stale) throw new Error("Dữ liệu chưa được cập nhật. Vui lòng tải lại trước khi xử lý đơn.");
        if (mutating.current?.key === key) return null;
        const activeMutation = { key };
        mutating.current = activeMutation;
        const request = ++sequence.current;
        setMutation({ key, type });
        try {
            const value = await action();
            if (request === sequence.current) setResult({ key, value });
            return request === sequence.current ? value : null;
        } catch (err) {
            if (request !== sequence.current) return null;
            throw new Error(getApiErrorMessage(err, fallback), { cause: err });
        } finally {
            if (mutating.current === activeMutation) mutating.current = null;
            setMutation(currentMutation => currentMutation?.key === key ? null : currentMutation);
        }
    }, [key, current]);

    return {
        detail: current?.value,
        loading: Boolean(prescriptionId && userId && (!current || current.loading)),
        error: current?.stale ? "" : current?.error || "",
        refreshWarning: current?.stale ? current.error : "",
        confirming: mutation?.key === key && mutation.type === "dispense",
        reviewing: mutation?.key === key && mutation.type === "review",
        reload,
        dispense: () => performMutation("dispense", () => confirmDispensing(prescriptionId), "Không thể xác nhận giao thuốc."),
        processReview: (request) => performMutation("review", () => request ? requestStockReview(prescriptionId, request)
            : recheckStockReview(prescriptionId, buildStockReviewRecheckRequest(current?.value || {})), "Không thể xử lý yêu cầu rà soát."),
    };
}

export default useDispensingDetail;
