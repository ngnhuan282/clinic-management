import { useEffect, useState } from "react";
import { getMyMedicalHistoryDetail } from "../api/medicalHistoryApi";
import getApiErrorMessage from "../utils/errorHandler";

function usePatientMedicalHistoryDetail(recordId, userId) {
    const [result, setResult] = useState(null);
    const [retry, setRetry] = useState(0);
    const key = JSON.stringify([userId, recordId, retry]);

    useEffect(() => {
        if (!recordId || !userId) return;
        const controller = new AbortController();
        getMyMedicalHistoryDetail(recordId, controller.signal)
            .then((value) => {
                if (!controller.signal.aborted) setResult({ key, value });
            })
            .catch((error) => {
                if (!controller.signal.aborted) setResult({ key,
                    error: getApiErrorMessage(error, "Không thể tải chi tiết lượt khám.") });
            });
        return () => controller.abort();
    }, [recordId, userId, key]);

    const current = result?.key === key ? result : null;
    return {
        detail: current?.value,
        loading: Boolean(recordId && !current),
        error: current?.error || "",
        reload: () => setRetry((value) => value + 1),
    };
}

export default usePatientMedicalHistoryDetail;
