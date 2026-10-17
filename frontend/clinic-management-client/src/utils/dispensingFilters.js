import { DISPENSING_STATUS_OPTIONS, REVIEW_STATUS_OPTIONS } from "../components/internal/pharmacy/dispensingStatus.js";

export const DEFAULT_DISPENSING_FILTERS = {
    search: "", workflowStatus: "", paymentStatus: "", reviewStatus: "",
    fromDate: "", toDate: "", pageNumber: 1, pageSize: 10,
};

function readDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || value.startsWith("0000")) return "";
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}

export function readDispensingFilters(params) {
    const workflowStatus = DISPENSING_STATUS_OPTIONS.find((x) => x.value === params.get("workflowStatus"))?.value || "";
    const pageNumber = Number(params.get("pageNumber"));
    const pageSize = Number(params.get("pageSize"));
    return {
        search: (params.get("search") || "").slice(0, 200),
        workflowStatus,
        paymentStatus: workflowStatus === "NeedsReview" && ["Paid", "Unpaid"].includes(params.get("paymentStatus")) ? params.get("paymentStatus") : "",
        reviewStatus: workflowStatus === "NeedsReview" ? REVIEW_STATUS_OPTIONS.find((x) => x.value === params.get("reviewStatus"))?.value || "" : "",
        fromDate: readDate(params.get("fromDate")),
        toDate: readDate(params.get("toDate")),
        pageNumber: Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 2147483647 ? pageNumber : 1,
        pageSize: [5, 10, 20].includes(pageSize) ? pageSize : 10,
    };
}

export function writeDispensingFilters(filters) {
    const params = new URLSearchParams();
    Object.keys(DEFAULT_DISPENSING_FILTERS).forEach((key) => {
        if (filters[key] != null && filters[key] !== DEFAULT_DISPENSING_FILTERS[key]) params.set(key, String(filters[key]));
    });
    return params;
}
