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
