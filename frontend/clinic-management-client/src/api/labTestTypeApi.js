// 1. Import axiosClient đã cấu hình sẵn thay vì thư viện axios gốc
import axiosClient from './axiosClient'; // Thay đổi đường dẫn import nếu cần (vd: '../api/axiosClient')

// 2. Chỉ khai báo endpoint /LabTestTypes (Không cần chữ /api ở đầu)
const ENDPOINT = '/LabTestTypes';

export const labTestTypeApi = {
  getAll: (includeInactive = true) => 
    axiosClient.get(`${ENDPOINT}?includeInactive=${includeInactive}`),
  
  getById: (id) => 
    axiosClient.get(`${ENDPOINT}/${id}`),
  
  create: (data) => 
    axiosClient.post(ENDPOINT, data),
  
  update: (id, data) => 
    axiosClient.put(`${ENDPOINT}/${id}`, data),
  
  delete: (id) => 
    axiosClient.delete(`${ENDPOINT}/${id}`)
};