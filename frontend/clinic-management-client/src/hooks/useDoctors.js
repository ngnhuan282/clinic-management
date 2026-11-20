import { useCallback, useEffect, useState } from "react";
import { getAdminDoctors } from "../api/doctorApi";
import { getApiErrorMessage } from "../utils/errorHandler";

export default function useDoctors(query) {
    const [result, setResult] = useState(null);
    const [revision, setRevision] = useState(0);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    const key = JSON.stringify([query, revision]);
    useEffect(() => {
        const controller = new AbortController();
        const params = { pageNumber: query.pageNumber, pageSize: query.pageSize };
        if (query.search.trim()) params.search = query.search.trim();
        if (query.departmentId) params.departmentId = Number(query.departmentId);
        getAdminDoctors(params, controller.signal)
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
