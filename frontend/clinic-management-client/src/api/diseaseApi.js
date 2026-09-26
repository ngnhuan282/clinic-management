import axiosClient from "./axiosClient";

export async function getDiseases(params) {
    const response = await axiosClient.get(
        "/diseases",
        { params }
    );

    return response.data.result;
}

export async function getDiseaseOptions(params) {
    const response = await axiosClient.get(
        "/diseases/options",
        { params }
    );

    return response.data.result;
}

export async function createDisease(payload) {
    const response = await axiosClient.post(
        "/diseases",
        payload
    );

    return response.data.result;
}

export async function updateDisease(diseaseId, payload) {
    const response = await axiosClient.put(
        `/diseases/${diseaseId}`,
        payload
    );

    return response.data.result;
}

export async function deleteDisease(diseaseId) {
    const response = await axiosClient.delete(
        `/diseases/${diseaseId}`
    );

    return response.data.result;
}
