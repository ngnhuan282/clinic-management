import axiosClient from "./axiosClient";

export async function getDispensingQueue(params) {
    const response = await axiosClient.get("/dispensing", { params });
    return response.data.result;
}

export async function getDispensingSummary() {
    const response = await axiosClient.get("/dispensing/summary");
    return response.data.result;
}

export async function getDispensingDetail(prescriptionId) {
    const response = await axiosClient.get(
        `/dispensing/${prescriptionId}`
    );
    return response.data.result;
}

export async function confirmDispensing(prescriptionId) {
    const response = await axiosClient.post(
        `/dispensing/${prescriptionId}/confirm`
    );
    return response.data.result;
}
