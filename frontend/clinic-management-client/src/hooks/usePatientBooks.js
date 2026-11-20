import { useCallback, useEffect, useState } from "react";

import { getPatientBooks } from "../api/patientBookApi";
import getApiErrorMessage from "../utils/errorHandler";

export const PATIENT_BOOK_PAGE_SIZE = 10;

/**
 * @param {{ search?: string, status?: string, pageNumber: number, pageSize?: number }} filters
 */
export function usePatientBooks({ search = "", status = "", pageNumber, pageSize = PATIENT_BOOK_PAGE_SIZE }) {
    const [reloadCount, setReloadCount] = useState(0);
    const requestKey = `${search}|${status}|${pageNumber}|${pageSize}|${reloadCount}`;
    const [result, setResult] = useState({ key: "", status: "ready", data: null, error: "" });

    useEffect(() => {
        let active = true;

        getPatientBooks({
            search: search || undefined,
            status: status || undefined,
            pageNumber,
            pageSize,
        })
            .then(data => active && setResult({ key: requestKey, status: "ready", data, error: "" }))
            .catch(error => active && setResult({ key: requestKey, status: "error", data: null, error: getApiErrorMessage(error) }));

        return () => { active = false; };
    }, [requestKey, search, status, pageNumber, pageSize]);

    const reload = useCallback(() => setReloadCount(count => count + 1), []);

    if (result.key !== requestKey) return { status: "loading", data: null, error: "", reload };
    return { status: result.status, data: result.data, error: result.error, reload };
}
