export function positiveId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export function notificationDestination(item, user) {
    const permissions = user.permissions || [];
    if (positiveId(item.stockReviewId) && ["Doctor", "DepartmentHead"].includes(user.role)
        && permissions.includes("pharmacy.prescribe")) return `/internal/doctor/stock-reviews/${item.stockReviewId}`;
    const id = positiveId(item.labTestId);
    if (!id || item.type !== "LabResult" || !permissions.includes("labs.viewOrders")) return null;
    if (user.role === "Patient" && permissions.includes("labs.viewOwnResult")) return `/lab-results?labTestId=${id}`;
    if (["Doctor", "DepartmentHead"].includes(user.role) && permissions.includes("labs.order")) return `/internal/doctor/lab-orders?labTestId=${id}`;
    return null;
}
