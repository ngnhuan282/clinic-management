export function canKeepDispensingSnapshot(previous, key, error) {
    const status = error?.response?.status;
    const transient = !status || status === 408 || status === 429 || status >= 500;
    return Boolean(transient && previous?.key === key && (previous.value || previous.pagedData));
}
