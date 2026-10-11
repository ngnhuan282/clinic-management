import { useCallback, useEffect, useState } from "react";

import getApiErrorMessage from "../utils/errorHandler";

/**
 * Loads the signed-in user's profile and saves edits through the given API functions.
 * @param {() => Promise<unknown>} load
 * @param {(payload: object) => Promise<unknown>} save
 */
export function useMyProfile(load, save) {
    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [errorStatus, setErrorStatus] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        load()
            .then(data => {
                if (!active) return;
                setProfile(data);
                setStatus("ready");
            })
            .catch(loadError => {
                if (!active) return;
                setError(getApiErrorMessage(loadError));
                setErrorStatus(loadError.response?.status ?? null);
                setErrorCode(loadError.response?.data?.code ?? null);
                setStatus("error");
            });
        return () => { active = false; };
    }, [load]);

    const submit = useCallback(async payload => {
        setSaving(true);
        setError("");
        try {
            const updated = await save(payload);
            setProfile(updated);
            return true;
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
            return false;
        } finally {
            setSaving(false);
        }
    }, [save]);

    return { profile, status, error, errorStatus, errorCode, saving, submit };
}
