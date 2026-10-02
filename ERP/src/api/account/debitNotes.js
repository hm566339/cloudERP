import { accountHttpClient } from '../common/client';

export const debitNotesApi = {
  getDebitNotes: async (params) => {
    const response = await accountHttpClient.get('/api/account/debit-notes', { params });
    return response.data;
  },

  getDebitNoteById: (id) => {
    return accountHttpClient.get(`/api/account/debit-notes/${id}`);
  },

  createDebitNote: (payload) => {
    const { data } = payload;
    return accountHttpClient.post('/api/account/debit-notes', { data });
  },

  updateDebitNote: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/debit-notes/${id}`, { data });
  },

  deleteDebitNote: (id) => {
    return accountHttpClient.delete(`/api/account/debit-notes/${id}`);
  },

  submitDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/submit`);
  },

  approveDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/approve`);
  },

  rejectDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/reject`);
  },

  postDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/post`);
  },

  reverseDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/reverse`);
  },

  cancelDebitNote: (id) => {
    return accountHttpClient.post(`/api/account/debit-notes/${id}/cancel`);
  },

  // Also include the legacy names that are currently used in DebitNotes.jsx:
  getById: (id) => {
    return accountHttpClient.get(`/api/account/debit-notes/${id}`);
  },
  create: (payload) => {
    const { data } = payload;
    return accountHttpClient.post('/api/account/debit-notes', { data });
  },
  update: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/debit-notes/${id}`, { data });
  },
  delete: (id) => {
    return accountHttpClient.delete(`/api/account/debit-notes/${id}`);
  }
};
