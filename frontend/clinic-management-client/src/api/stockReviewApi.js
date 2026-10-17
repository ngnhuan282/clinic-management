import axiosClient from "./axiosClient";

/** Doctor scope only. status: Pending/Resolved, search, pageNumber/pageSize. */
export async function getDoctorStockReviews(params) {
    return (await axiosClient.get("/stock-reviews", { params })).data.result;
}

/** Returns review audit, current prescription, both version stamps and invoice guard. */
export async function getDoctorStockReview(reviewId) {
    return (await axiosClient.get(`/stock-reviews/${reviewId}`)).data.result;
}

/** Both expected versions and reason required; billed adjustments are proposals, not applied edits. */
export async function respondToStockReview(reviewId, payload) {
    return (await axiosClient.post(`/stock-reviews/${reviewId}/responses`, payload)).data.result;
}
