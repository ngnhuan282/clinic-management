import axiosClient from './axiosClient';

const invoiceApi = {
  getPendingBillings: (stage) => axiosClient.get(`/invoices/pending?stage=${stage}`),
  createInvoice: (data) => axiosClient.post('/invoices', data),
  getInvoiceDetail: (id) => axiosClient.get(`/invoices/${id}`),
};

export default invoiceApi;