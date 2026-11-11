import { useCallback, useEffect, useState } from "react";
import getApiErrorMessage from "../utils/errorHandler";

// A loader is either an imported function or a useCallback keyed by its parameters.
export default function usePublicResource(loader) {
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);
    const retry = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        let active = true;
        Promise.resolve().then(loader)
            .then(data => active && setResult({ loader, revision, status: "ready", data }))
            .catch(error => active && setResult({ loader, revision, status: "error", error: getApiErrorMessage(error) }));
        return () => { active = false; };
    }, [loader, revision]);
    return result?.loader === loader && result.revision === revision
        ? { ...result, retry } : { status: "loading", data: null, retry };
}
