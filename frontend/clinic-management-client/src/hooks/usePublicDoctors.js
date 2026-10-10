import { useEffect, useState } from "react";

import { searchPublicDoctors } from "../api/doctorApi";
import getApiErrorMessage from "../utils/errorHandler";

export const DOCTOR_PAGE_SIZE = 9;

/**
 * @param {{ fullName?: string, departmentId?: string, roomId?: string, pageNumber: number }} filters
 */
export function usePublicDoctors({ fullName = "", departmentId = "", roomId = "", pageNumber }) {
    const requestKey = `${fullName}|${departmentId}|${roomId}|${pageNumber}`;
    const [result, setResult] = useState({ key: "", status: "ready", data: null, error: "" });

    useEffect(() => {
        let active = true;

        searchPublicDoctors({
            fullName: fullName || undefined,
            departmentId: departmentId || undefined,
            roomId: roomId || undefined,
            pageNumber,
            pageSize: DOCTOR_PAGE_SIZE,
        })
            .then(data => active && setResult({ key: requestKey, status: "ready", data, error: "" }))
            .catch(error => active && setResult({ key: requestKey, status: "error", data: null, error: getApiErrorMessage(error) }));

        return () => { active = false; };
    }, [requestKey, fullName, departmentId, roomId, pageNumber]);

    // A result belongs to one filter set; until it arrives for the current filters, the page shows loading.
    if (result.key !== requestKey) return { status: "loading", data: null, error: "" };
    return { status: result.status, data: result.data, error: result.error };
}
