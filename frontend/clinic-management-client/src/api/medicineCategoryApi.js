import axiosClient from "./axiosClient";

export async function getMedicineCategories(params) {
    const response = await axiosClient.get(
        "/medicine-categories",
        { params }
    );

    return response.data.result;
}

export async function getMedicineCategorySummary() {
    const response = await axiosClient.get(
        "/medicine-categories/summary"
    );

    return response.data.result;
}

export async function getMedicineCategoryOptions() {
    const response = await axiosClient.get(
        "/medicine-categories/options"
    );

    return response.data.result;
}

export async function createMedicineCategory(payload) {
    const response = await axiosClient.post(
        "/medicine-categories",
        payload
    );

    return response.data.result;
}

export async function updateMedicineCategory(
    categoryId,
    payload
) {
    const response = await axiosClient.put(
        `/medicine-categories/${categoryId}`,
        payload
    );

    return response.data.result;
}

export async function deleteMedicineCategory(categoryId) {
    const response = await axiosClient.delete(
        `/medicine-categories/${categoryId}`
    );

    return response.data.result;
}
