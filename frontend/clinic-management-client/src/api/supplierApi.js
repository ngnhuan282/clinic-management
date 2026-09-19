import axiosClient from "./axiosClient";

export async function getSuppliers(params) {
    const response = await axiosClient.get(
        "/suppliers",
        { params }
    );

    return response.data.result;
}

export async function getSupplierSummary() {
    const response = await axiosClient.get(
        "/suppliers/summary"
    );

    return response.data.result;
}

export async function getSupplierOptions() {
    const response = await axiosClient.get(
        "/suppliers/options"
    );

    return response.data.result;
}

export async function createSupplier(payload) {
    const response = await axiosClient.post(
        "/suppliers",
        payload
    );

    return response.data.result;
}

export async function updateSupplier(supplierId, payload) {
    const response = await axiosClient.put(
        `/suppliers/${supplierId}`,
        payload
    );

    return response.data.result;
}

export async function deleteSupplier(supplierId) {
    const response = await axiosClient.delete(
        `/suppliers/${supplierId}`
    );

    return response.data.result;
}
