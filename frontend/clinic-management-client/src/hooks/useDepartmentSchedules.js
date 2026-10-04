import { useEffect, useState } from "react";
import doctorScheduleApi from "../api/doctorScheduleApi";
import getApiErrorMessage from "../utils/errorHandler";
import useNotifications from "./useNotifications";
import useAuth from "./useAuth";
import { mondayOf } from "../utils/scheduleCalendar";

export default function useDepartmentSchedules({ mode, date, doctorId, roomId }) {
    const [options, setOptions] = useState(null);
    const [state, setState] = useState({ items: [], loading: true });
    const [reload, setReload] = useState(0);
    const { revision } = useNotifications();
    const { userId } = useAuth();
    const weekStart = mondayOf(date);
    const requestKey = JSON.stringify({ ...(mode === "week" ? { weekStart } : { date }),
        doctorId: doctorId || undefined, roomId: roomId || undefined });

    useEffect(() => {
        let disposed = false;
        const params = JSON.parse(requestKey);
        Promise.resolve().then(() => { if (!disposed) setState({ items: [], loading: true, requestKey, userId }); });
        Promise.all([doctorScheduleApi.department(params), doctorScheduleApi.departmentOptions()])
            .then(([scheduleResponse, optionsResponse]) => {
                if (disposed) return;
                setOptions({ userId, data: optionsResponse.data.result });
                setState({ items: scheduleResponse.data.result, loading: false, requestKey, userId });
            }).catch(error => {
                if (!disposed) setState({ items: [], loading: false, error: getApiErrorMessage(error), requestKey, userId });
            });
        return () => { disposed = true; };
    }, [requestKey, userId, reload, revision]);

    const visible = state.requestKey === requestKey && state.userId === userId ? state : { items: [], loading: true };
    return { ...visible, options: options?.userId === userId ? options.data : null, refresh: () => setReload(value => value + 1) };
}
