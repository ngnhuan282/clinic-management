import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getRoles, getUsers, getUserSummary } from "../api/userApi";
import { getApiErrorMessage } from "../utils/errorHandler";

export default function useUsers(query) {
    const userId = useSelector(state => state.auth.user?.userId);
    const [result, setResult] = useState(null);
    const [revision, setRevision] = useState(0);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    const key = JSON.stringify([query, revision, userId]);
    useEffect(() => {
        const controller = new AbortController();
        const params = { pageNumber: query.pageNumber, pageSize: query.pageSize };
        if (query.search.trim()) params.search = query.search.trim();
        if (query.roleId) params.roleId = Number(query.roleId);
        if (query.status !== "") params.status = query.status === "true";
        Promise.all([getUsers(params, controller.signal), getRoles(controller.signal), getUserSummary(params, controller.signal)])
            .then(([page, roles, summary]) => !controller.signal.aborted && setResult({ key, ...page, roles, summary }))
            .catch(error => !controller.signal.aborted && setResult({ key, error: getApiErrorMessage(error) }));
        return () => controller.abort();
    }, [key, query]);
    const current = result?.key === key ? result : null;
    return { items: current?.items || [], roles: current?.roles || [], summary: current?.summary,
        totalItems: current?.totalItems || 0, loading: !current, error: current?.error || "", reload };
}
