import { useEffect, useRef } from "react";
import useNotifications from "./useNotifications";

export default function useDispensingAutoRefresh(refresh, enabled = true) {
    const { revision = 0 } = useNotifications() || {};
    const lastRevision = useRef(revision);

    useEffect(() => {
        const changed = lastRevision.current !== revision;
        lastRevision.current = revision;
        if (enabled && changed) void refresh();
    }, [enabled, refresh, revision]);

    useEffect(() => {
        if (!enabled) return;
        const revalidate = () => {
            if (document.visibilityState !== "hidden") void refresh();
        };
        window.addEventListener("focus", revalidate);
        document.addEventListener("visibilitychange", revalidate);
        const timer = window.setInterval(revalidate, 30000);
        return () => {
            window.removeEventListener("focus", revalidate);
            document.removeEventListener("visibilitychange", revalidate);
            window.clearInterval(timer);
        };
    }, [enabled, refresh]);
}
