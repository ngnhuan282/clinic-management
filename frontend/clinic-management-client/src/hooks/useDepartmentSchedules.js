import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import doctorScheduleApi from "../api/doctorScheduleApi";
import getApiErrorMessage from "../utils/errorHandler";
import useNotifications from "./useNotifications";
import useAuth from "./useAuth";
import { mondayOf } from "../utils/scheduleCalendar";

export default function useDepartmentSchedules({ mode, date, doctorId, roomId }) {
    const [options, setOptions] = useState(null);
    const [state, setState] = useState({ items: [], loading: true });
    const [reload, setReload] = useState(0);
    const { departmentCalendarRevision } = useNotifications();
    const { userId, sessionRevision } = useAuth();
    const navigate = useNavigate();
    const weekStart = mondayOf(date);
    const requestKey = JSON.stringify({ userId, sessionRevision, departmentCalendarRevision, reload,
        ...(mode === "week" ? { weekStart } : { date }),
        doctorId: doctorId || undefined, roomId: roomId || undefined });

    useEffect(() => {
        const controller = new AbortController();
        const { date, weekStart, doctorId, roomId } = JSON.parse(requestKey);
        const params = { date, weekStart, doctorId, roomId };
        Promise.all([doctorScheduleApi.department(params, controller.signal), doctorScheduleApi.departmentOptions(controller.signal)])
            .then(([scheduleResponse, optionsResponse]) => {
                if (controller.signal.aborted) return;
                setOptions({ requestKey, data: optionsResponse.data.result });
                setState({ items: scheduleResponse.data.result, loading: false, requestKey, userId });
            }).catch(error => {
                if (controller.signal.aborted) return;
                if (error.response?.status === 403)
                    navigate("/403", { replace: true, state: { deniedPath: "/internal/department-schedules" } });
                setOptions(null);
                setState({ items: [], loading: false, error: getApiErrorMessage(error), requestKey, userId });
            });
        return () => controller.abort();
    }, [requestKey, userId, navigate]);

    const visible = state.requestKey === requestKey && state.userId === userId ? state : { items: [], loading: true };
    return { ...visible, options: options?.requestKey === requestKey ? options.data : null, refresh: () => setReload(value => value + 1) };
}
