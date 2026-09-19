import axiosClient from "./axiosClient";

export async function getMedicines(params) {
    const response = await axiosClient.get(
        "/medicines",
        { params }
    );

    return response.data.result;
}

export async function getMedicineSummary() {
    const response = await axiosClient.get(
        "/medicines/summary"
    );

    return response.data.result;
}

export async function getMedicineOptions() {
    const response = await axiosClient.get(
        "/medicines/options"
    );

    return response.data.result;
}

export async function createMedicine(payload) {
    const response = await axiosClient.post(
        "/medicines",
        payload
    );

    return response.data.result;
}

export async function updateMedicine(
    medicineId,
    payload
) {
    const response = await axiosClient.put(
        `/medicines/${medicineId}`,
        payload
    );

    return response.data.result;
}

export async function deleteMedicine(medicineId) {
    const response = await axiosClient.delete(
        `/medicines/${medicineId}`
    );

    return response.data.result;
}
