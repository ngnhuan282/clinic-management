import axiosClient from "./axiosClient";

export async function getPurchaseOrders(params) {
    const response = await axiosClient.get(
        "/purchase-orders",
        { params }
    );

    return response.data.result;
}

export async function getPurchaseOrderSummary() {
    const response = await axiosClient.get(
        "/purchase-orders/summary"
    );

    return response.data.result;
}

export async function getPurchaseOrder(purchaseOrderId) {
    const response = await axiosClient.get(
        `/purchase-orders/${purchaseOrderId}`
    );

    return response.data.result;
}

export async function createPurchaseOrder(payload) {
    const response = await axiosClient.post(
        "/purchase-orders",
        payload
    );

    return response.data.result;
}

export async function updatePurchaseOrder(
    purchaseOrderId,
    payload
) {
    const response = await axiosClient.put(
        `/purchase-orders/${purchaseOrderId}`,
        payload
    );

    return response.data.result;
}

export async function receivePurchaseOrder(purchaseOrderId) {
    const response = await axiosClient.post(
        `/purchase-orders/${purchaseOrderId}/receive`
    );

    return response.data.result;
}

export async function cancelPurchaseOrder(purchaseOrderId) {
    const response = await axiosClient.post(
        `/purchase-orders/${purchaseOrderId}/cancel`
    );

    return response.data.result;
}
