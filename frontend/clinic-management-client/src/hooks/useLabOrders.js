import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useNotifications from "./useNotifications";
import labTestApi from "../api/labTestApi";
import getApiErrorMessage from "../utils/errorHandler";

export default function useLabOrders() {
    const { userId } = useAuth();
    const { labResultsRevision } = useNotifications();
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);
    const key = JSON.stringify([userId, labResultsRevision, revision]);
    useEffect(() => {
        const controller = new AbortController();
        labTestApi.getAll(undefined, { signal: controller.signal })
            .then(response => !controller.signal.aborted && setResult({ key, orders: response.data }))
            .catch(error => !controller.signal.aborted && setResult({ key, error: getApiErrorMessage(error) }));
        return () => controller.abort();
    }, [key]);
    const current = result?.key === key ? result : null;
    return { orders: current?.orders || [], loading: !current, error: current?.error || "",
        reload: () => setRevision(value => value + 1) };
}
