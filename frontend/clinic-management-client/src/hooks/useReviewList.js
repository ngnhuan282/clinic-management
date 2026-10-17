import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { reviewApi } from "../api/reviewApi";
import { getApiErrorMessage } from "../utils/errorHandler";

export function useReviewList(mode, doctorId) {
    const userId = useSelector(state => state.auth.user?.userId);
    const [pageNumber, setPageNumber] = useState(1);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);
    const key = JSON.stringify([mode, doctorId, pageNumber, revision, userId]);
    useEffect(() => {
        const controller = new AbortController();
        reviewApi[mode]({ doctorId, pageNumber, pageSize: 10 }, controller.signal)
            .then(data => setResult({ key, data }))
            .catch(error => { if (!controller.signal.aborted) setResult({ key, error: getApiErrorMessage(error) }); });
        return () => controller.abort();
    }, [mode, doctorId, pageNumber, key]);
    const current = result?.key === key ? result : null;
    return { data: current?.data, error: current?.error, loading: !current, pageNumber, setPageNumber,
        refresh: () => setRevision(value => value + 1) };
}
