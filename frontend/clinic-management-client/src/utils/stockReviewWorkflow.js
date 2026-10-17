const statuses = {
    PendingDoctor: { label: "Chờ bác sĩ", color: "#B45309", background: "#FFFBEB" },
    WaitingPharmacyRecheck: { label: "Chờ dược sĩ kiểm tra", color: "#005DAC", background: "#EFF6FF" },
    WaitingBilling: { label: "Chờ đối soát hóa đơn", color: "#B45309", background: "#FFFBEB" },
    Completed: { label: "Đã đối chiếu đủ tồn", color: "#047857", background: "#ECFDF5" },
    StillShortage: { label: "Đã kết thúc: vẫn thiếu", color: "#B91C1C", background: "#FEF2F2" },
};

export function getStockReviewWorkflowStatus(review) {
    if (review.status === "Resolved") return "Completed";
    if (review.status === "StillShortage") return "StillShortage";
    const outcome = review.decisions?.[0]?.outcome || review.lastOutcome;
    if (outcome === "AwaitingBilling") return "WaitingBilling";
    if (["Kept", "Applied"].includes(outcome)) return "WaitingPharmacyRecheck";
    return "PendingDoctor";
}

export function getStockReviewStatusConfig(review) {
    return statuses[getStockReviewWorkflowStatus(review)];
}

export function getStockReviewRecheckResultConfig(review) {
    const workflow = getStockReviewWorkflowStatus(review);
    if (!["Completed", "StillShortage"].includes(workflow)) return null;
    return { ...statuses[workflow], label: workflow === "Completed" ? "Đủ tồn còn hạn" : "Vẫn thiếu thuốc" };
}

export function getStockReviewLockedMessage(review) {
    switch (getStockReviewWorkflowStatus(review)) {
        case "WaitingBilling": return "Đã gửi phương án điều chỉnh. Chưa áp dụng vào đơn thuốc; đang chờ bộ phận thu phí đối soát.";
        case "WaitingPharmacyRecheck": return "Đã gửi phản hồi chính thức. Đang chờ dược sĩ kiểm tra lại tồn.";
        case "StillShortage": return "Vòng rà soát đã kết thúc do vẫn thiếu thuốc. Phản hồi của bác sĩ được giữ nguyên trong nhật ký.";
        case "Completed": return "Vòng rà soát đã kết thúc sau khi đối chiếu đủ tồn.";
        default: return "Yêu cầu hoặc đơn thuốc hiện tại không còn ở trạng thái cho phép phản hồi.";
    }
}

export function buildStockReviewRecheckRequest(detail) {
    const review = detail.reviews?.find(item => item.status === "Pending");
    if (!review || getStockReviewWorkflowStatus(review) !== "WaitingPharmacyRecheck") return null;
    return { expectedReviewId: review.reviewId, expectedReviewUpdatedAt: review.updatedAt,
        expectedPrescriptionUpdatedAt: detail.updatedAt };
}
