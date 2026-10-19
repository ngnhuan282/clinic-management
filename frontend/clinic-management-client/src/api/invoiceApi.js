// import axiosClient from './axiosClient';

// const invoiceApi = {
//   getPendingBillings: (stage) => axiosClient.get(`/invoices/pending?stage=${stage}`),
//   createInvoice: (data) => axiosClient.post('/invoices', data),
//   getInvoiceDetail: (id) => axiosClient.get(`/invoices/${id}`),
// };

// export default invoiceApi;

import axiosClient from './axiosClient';

const invoiceApi = {
  getPendingBillings: (stage, config) => {
    return axiosClient.get('/Invoices/pending', { ...config, params: { stage } });
  },
  createInvoice: (dto) => {
    return axiosClient.post('/Invoices', dto);
  },
  getInvoiceById: (id) => {
    return axiosClient.get(`/Invoices/${id}`);
  },
  // Nâng cấp Tuần 6
  getInvoiceHistory: (search, config) => {
    return axiosClient.get('/Invoices/history', { ...config, params: { search: search || '' } });
  },
  createAdjustment: (dto) => {
    return axiosClient.post('/Invoices/adjustment', dto);
  }
};

export default invoiceApi;
