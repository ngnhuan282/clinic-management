import axiosClient from './axiosClient';

const labTestApi = {
  getAll: (params, options = {}) => axiosClient.get('/labtests', { params, ...options }),
  createOrder: (data) => axiosClient.post('/labtests', data),
  getPendingList: () => axiosClient.get('/labtests/pending'),
  startTest: (id) => axiosClient.post(`/labtests/${id}/start`),
  submitResult: (data) => axiosClient.post('/labtests/results', data),
  getDetail: (id, options = {}) => axiosClient.get(`/labtests/${id}`, options),
};

export default labTestApi;