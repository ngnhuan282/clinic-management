import axiosClient from './axiosClient';

const labTestApi = {
  // 1. Thêm hàm getAll để lấy toàn bộ danh sách chỉ định/loại xét nghiệm
  getAll: (params, options = {}) => axiosClient.get('/labtests', { params, ...options }),

  // Bác sĩ tạo chỉ định
  createOrder: (data) => axiosClient.post('/labtests', data),

  // KTV lấy danh sách chờ
  getPendingList: () => axiosClient.get('/labtests/pending'),

  // KTV nhập kết quả
  submitResult: (data) => axiosClient.post('/labtests/results', data),

  // Xem chi tiết (có check quyền)
  getDetail: (id, options = {}) => axiosClient.get(`/labtests/${id}`, options),
};

export default labTestApi;
