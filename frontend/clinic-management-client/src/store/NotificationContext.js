import { createContext } from "react";

export default createContext({
    items: [],
    toasts: [],
    showToast: () => {},
    toastSuccess: () => {},
    toastError: () => {},
    dismissToast: () => {},
    refresh: () => {},
});
