import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import notificationApi from "../../api/notificationApi";
import NotificationContext from "../../store/NotificationContext";
import { connectNotifications } from "../../services/signalrService";
import getApiErrorMessage from "../../utils/errorHandler";

export default function NotificationProvider({ children }) {
    const { userId, role, isAuthenticated } = useAuth();
    const [state, setState] = useState({});
    const [pagination, setPagination] = useState({});
    const pageNumber = pagination.userId === userId ? pagination.pageNumber : 1;
    const setPageNumber = value => setPagination({ userId, pageNumber: value });
    const [reload, setReload] = useState(0);
    const [live, setLive] = useState({ revision: 0 });
    const refresh = () => setReload(value => value + 1);

    useEffect(() => {
        if (!isAuthenticated) return;
        let disposed = false;
        Promise.resolve().then(() => { if (!disposed) setState({ userId, loading: true }); });
        notificationApi.list({ pageNumber, pageSize: 20 }).then(response => {
            if (!disposed) setState({ userId, ...response.data.result, loading: false });
        }).catch(error => {
            if (!disposed) setState({ userId, error: getApiErrorMessage(error), loading: false });
        });
        return () => { disposed = true; };
    }, [userId, isAuthenticated, pageNumber, reload]);

    useEffect(() => {
        if (!isAuthenticated) return;
        return connectNotifications(message => {
            setLive(value => ({ userId, message, revision: value.revision + 1 }));
            refresh();
        }, () => {
            setLive(value => ({ userId, revision: value.revision + 1 }));
            refresh();
        });
    }, [userId, role, isAuthenticated]);

    const visible = isAuthenticated && state.userId === userId ? state : {};
    const markRead = async id => { await notificationApi.markRead(id); refresh(); };
    return <NotificationContext.Provider value={{ ...visible, items: visible.items || [], refresh,
        pageNumber, setPageNumber, markRead, revision: live.userId === userId ? live.revision : 0,
        message: isAuthenticated && live.userId === userId ? live.message : null }}>
        {children}
    </NotificationContext.Provider>;
}
