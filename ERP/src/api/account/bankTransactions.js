import { accountHttpClient } from '../common/client';

export const bankTransactionsApi = {
  // Get all Bank Transactions with filters and pagination
  getBankTransactions: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions', { params });
    return response.data;
  },

  // Get Bank Transaction by ID
  getBankTransactionById: async (id) => {
    const response = await accountHttpClient.get(`/api/account/bank-transactions/${id}`);
    return response.data;
  },

  // Create new Bank Transaction
  createBankTransaction: async (payload) => {
    const response = await accountHttpClient.post('/api/account/bank-transactions', payload);
    return response.data;
  },

  // Update existing Bank Transaction
  updateBankTransaction: async ({ id, data }) => {
    const response = await accountHttpClient.put(`/api/account/bank-transactions/${id}`, { data });
    return response.data;
  },

  // Delete Bank Transaction
  deleteBankTransaction: async (id) => {
    const response = await accountHttpClient.delete(`/api/account/bank-transactions/${id}`);
    return response.data;
  },

  // Reconcile Transaction
  reconcileTransaction: async (id) => {
    const response = await accountHttpClient.put(`/api/account/bank-transactions/${id}/reconcile`);
    return response.data;
  },

  // Unreconcile Transaction
  unreconcileTransaction: async (id) => {
    const response = await accountHttpClient.put(`/api/account/bank-transactions/${id}/unreconcile`);
    return response.data;
  },

  // Reverse Transaction
  reverseTransaction: async ({ id, narration }) => {
    const response = await accountHttpClient.put(`/api/account/bank-transactions/${id}/reverse`, null, { params: { narration } });
    return response.data;
  },

  // Get Transactions By Bank Account
  getTransactionsByBankAccount: async ({ bankAccountId, params }) => {
    const response = await accountHttpClient.get(`/api/account/bank-transactions/bank-account/${bankAccountId}`, { params });
    return response.data;
  },

  // Get Reconciled Transactions
  getReconciledTransactions: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions/reconciled', { params });
    return response.data;
  },

  // Get Unreconciled Transactions
  getUnreconciledTransactions: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions/unreconciled', { params });
    return response.data;
  },

  // Get Reconciliation Summary
  getReconciliationSummary: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions/reconciliation-summary', { params });
    return response.data;
  },

  // Get Bank Ledger
  getBankLedger: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions/ledger', { params });
    return response.data;
  },

  // Get Bank Ledger By Date Range
  getBankLedgerByDateRange: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-transactions/ledger/date-range', { params });
    return response.data;
  }
};
