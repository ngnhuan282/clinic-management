import axiosClient from './axiosClient';

const invoiceApi = {
  getPatientInvoices: (pageNumber, signal) =>
    axiosClient.get('/patients/me/invoices', { params: { pageNumber }, signal }),
  previewAdjustment: (dto) => axiosClient.post('/Invoices/adjustment/preview', dto),
  getPendingBillings: (stage, config) => {
    return axiosClient.get('/Invoices/pending', { ...config, params: { stage } });
  },
  createInvoice: (dto) => {
    return axiosClient.post('/Invoices', dto);
  },
  recordPayment: (invoiceId, dto) => {
    return axiosClient.post(`/Invoices/${invoiceId}/payments`, dto);
  },
  getInvoiceById: (id) => {
    return axiosClient.get(`/Invoices/${id}`);
  },
  getInvoiceHistory: (search, config) => {
    return axiosClient.get('/Invoices/history', { ...config, params: { search: search || '' } });
  },
  createAdjustment: (dto) => {
    return axiosClient.post('/Invoices/adjustment', dto);
  },
};

export default invoiceApi;
