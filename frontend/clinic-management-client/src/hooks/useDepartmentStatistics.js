import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartmentStatistics } from "../api/departmentStatisticsApi";
import getApiErrorMessage from "../utils/errorHandler";
import useAuth from "./useAuth";
import useNotifications from "./useNotifications";

export default function useDepartmentStatistics(period) {
    const { userId } = useAuth();
    const { departmentStatisticsRevision } = useNotifications();
    const navigate = useNavigate();
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState(null);
    const requestKey = JSON.stringify({ userId, ...period, revision, departmentStatisticsRevision });

    useEffect(() => {
        const controller = new AbortController();
        const { fromDate, toDate } = JSON.parse(requestKey);
        getDepartmentStatistics({ fromDate, toDate }, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) setState({ requestKey, data });
            }).catch(error => {
                if (controller.signal.aborted) return;
                if (error.response?.status === 403 && error.response?.data?.code !== 1010)
                    navigate("/403", { replace: true, state: { deniedPath: "/internal/department-statistics" } });
                setState({ requestKey, error: error.response || error.request ? getApiErrorMessage(error) : error.message,
                    fields: error.response?.data?.errors });
            });
        return () => controller.abort();
    }, [requestKey, navigate]);

    const visible = state?.requestKey === requestKey ? state : null;
    return { data: visible?.data, error: visible?.error, fields: visible?.fields,
        loading: !visible, refresh: () => setRevision(value => value + 1) };
}
