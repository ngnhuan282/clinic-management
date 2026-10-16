import { useCallback, useEffect, useRef, useState } from "react";
import { getDoctorStockReview, respondToStockReview } from "../api/stockReviewApi";
import { getPrescriptionMedicineOptions } from "../api/prescriptionApi";
import getApiErrorMessage from "../utils/errorHandler";

export default function useDoctorStockReview(reviewId, userId) {
    const key = JSON.stringify([reviewId, userId]);
    const sequence = useRef(0);
    const activeKey = useRef(key);
    useEffect(() => { activeKey.current = key; }, [key]);
    const mutation = useRef(false);
    const [result, setResult] = useState(null);
    const [busyKey, setBusyKey] = useState(null);
    const current = result?.key === key ? result : null;
    const reload = useCallback(async () => {
        if (!reviewId || !userId) return;
        const request = ++sequence.current;
        setResult({ key, loading: true });
        try {
            const detail = await getDoctorStockReview(reviewId);
            const options = detail.canRespond ? await getPrescriptionMedicineOptions() : [];
            if (sequence.current === request && activeKey.current === key) setResult({ key, detail, options });
        } catch (error) {
            if (sequence.current === request && activeKey.current === key) setResult({ key, error: getApiErrorMessage(error) });
        }
    }, [key, reviewId, userId]);
    useEffect(() => {
        const seq = sequence;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void reload();
        return () => { seq.current++; };
    }, [reload]);
    async function respond(payload) {
        if (mutation.current || !current?.detail) return null;
        mutation.current = true;
        setBusyKey(key);
        const request = ++sequence.current;
        try {
            const detail = await respondToStockReview(reviewId, payload);
            if (sequence.current === request && activeKey.current === key) setResult({ key, detail, options: current.options });
            return sequence.current === request && activeKey.current === key ? detail : null;
        } catch (error) { throw new Error(getApiErrorMessage(error), { cause: error }); }
        finally { mutation.current = false; setBusyKey(null); }
    }
    return { detail: current?.detail, options: current?.options || [], error: current?.error,
        loading: Boolean(reviewId && userId && (!current || current.loading)), busy: Boolean(busyKey), reload, respond };
}
