const KEYS = ["accessToken", "refreshToken", "user"];

export function readSession() {
    for (const storage of [sessionStorage, localStorage]) storage.removeItem("refreshToken");
    for (const storage of [sessionStorage, localStorage]) {
        try {
            const accessToken = storage.getItem("accessToken");
            const user = JSON.parse(storage.getItem("user") || "null");
            if (accessToken && user?.userId && user?.role) {
                return { accessToken, user, remember: storage === localStorage };
            }
        } catch { /* Ignore an incomplete or damaged saved session. */ }
    }
    return null;
}

export function clearSession() {
    for (const storage of [sessionStorage, localStorage]) {
        for (const key of KEYS) storage.removeItem(key);
    }
}

export function saveSession({ accessToken, user, remember = false }) {
    clearSession();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
    storage.setItem("user", JSON.stringify(user));
}
