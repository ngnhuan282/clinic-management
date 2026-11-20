import { useCallback, useEffect, useState } from "react";
import { getAdminStaff } from "../api/staffApi";
import { getApiErrorMessage } from "../utils/errorHandler";

export default function useStaff(query) {
    const [result, setResult] = useState(null);
    const [revision, setRevision] = useState(0);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    const key = JSON.stringify([query, revision]);
    useEffect(() => {
        const controller = new AbortController();
        const params = { pageNumber: query.pageNumber, pageSize: query.pageSize };
        if (query.search.trim()) params.search = query.search.trim();
        if (query.jobPositionId) params.jobPositionId = Number(query.jobPositionId);
        getAdminStaff(params, controller.signal)
            .then(page => !controller.signal.aborted && setResult({ key, ...page }))
            .catch(error => !controller.signal.aborted && setResult({ key, error: getApiErrorMessage(error) }));
        return () => controller.abort();
    }, [key, query]);
    const current = result?.key === key ? result : null;
    return {
        items: current?.items || [],
        totalItems: current?.totalItems || 0,
        loading: !current,
        error: current?.error || "",
        reload,
    };
}
