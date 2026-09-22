import { useCallback, useEffect, useState } from "react";
import { getRoles, getUsers } from "../api/userApi";
import { getApiErrorMessage } from "../utils/errorHandler";

export default function useUsers(query) {
    const [state, setState] = useState({ items: [], totalItems: 0, roles: [], loading: true, error: "" });
    const [revision, setRevision] = useState(0);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        Promise.resolve().then(() => {
            if (!controller.signal.aborted) setState(current => ({ ...current, loading: true, error: "" }));
        });
        Promise.all([getUsers(query, controller.signal), getRoles(controller.signal)])
            .then(([page, roles]) => { if (!controller.signal.aborted) setState({ ...page, roles, loading: false, error: "" }); })
            .catch(error => { if (!controller.signal.aborted) setState(current => ({ ...current, loading: false, error: getApiErrorMessage(error) })); });
        return () => controller.abort();
    }, [query, revision]);
    return { ...state, reload };
}
