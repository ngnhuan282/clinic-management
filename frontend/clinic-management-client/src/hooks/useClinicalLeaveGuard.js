import { useCallback, useEffect } from "react";

const message = "Bạn có nội dung chưa lưu. Rời trang và bỏ các thay đổi này?";

export default function useClinicalLeaveGuard(dirty, onDiscard) {
    useEffect(() => {
        if (!dirty) return;
        const beforeUnload = event => { event.preventDefault(); event.returnValue = ""; };
        const beforeLink = event => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const link = event.target.closest?.("a[href]");
            if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
            const destination = new URL(link.href, window.location.href);
            if (destination.origin !== window.location.origin || destination.pathname + destination.search === window.location.pathname + window.location.search) return;
            if (!window.confirm(message)) { event.preventDefault(); event.stopImmediatePropagation(); }
            else onDiscard();
        };
        window.addEventListener("beforeunload", beforeUnload);
        document.addEventListener("click", beforeLink, true);
        return () => {
            window.removeEventListener("beforeunload", beforeUnload);
            document.removeEventListener("click", beforeLink, true);
        };
    }, [dirty, onDiscard]);

    return useCallback(action => {
        if (dirty && !window.confirm(message)) return false;
        onDiscard();
        action();
        return true;
    }, [dirty, onDiscard]);
}
