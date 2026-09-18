import axiosClient from "./axiosClient";

export async function getInventory(params) {
    const response = await axiosClient.get(
        "/inventory",
        { params }
    );

    return response.data.result;
}

export async function getInventorySummary() {
    const response = await axiosClient.get(
        "/inventory/summary"
    );

    return response.data.result;
}

export async function createInventory(payload) {
    const response = await axiosClient.post(
        "/inventory",
        payload
    );

    return response.data.result;
}

export async function updateInventory(
    inventoryId,
    payload
) {
    const response = await axiosClient.put(
        `/inventory/${inventoryId}`,
        payload
    );

    return response.data.result;
}

export async function deleteInventory(inventoryId) {
    const response = await axiosClient.delete(
        `/inventory/${inventoryId}`
    );

    return response.data.result;
}
