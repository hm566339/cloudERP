import { accountHttpClient } from '../common/client';

export const glJournalLinesApi = {
  getJournalLines: (params) => {
    return accountHttpClient.get('/api/account/gl/journal-lines', { params });
  },

  getJournalLineById: (id) => {
    return accountHttpClient.get(`/api/account/gl/journal-lines/${id}`);
  },

  createJournalLine: ({ journalId, data }) => {
    return accountHttpClient.post(`/api/account/gl/journal-lines/journal/${journalId}`, data);
  },

  updateJournalLine: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/gl/journal-lines/${id}`, data);
  },

  deleteJournalLine: (id) => {
    return accountHttpClient.delete(`/api/account/gl/journal-lines/${id}`);
  },

  getJournalLinesByJournal: ({ journalId, params }) => {
    return accountHttpClient.get(`/api/account/gl/journal-lines/journal/${journalId}`, { params });
  },

  getJournalLinesByAccount: ({ accountId, params }) => {
    return accountHttpClient.get(`/api/account/gl/journal-lines/account/${accountId}`, { params });
  },

  getLedgerByAccount: ({ accountId, params }) => {
    return accountHttpClient.get(`/api/account/gl/journal-lines/ledger/${accountId}`, { params });
  }
};
