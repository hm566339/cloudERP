import { accountHttpClient } from '../common/client';

export const bankAccountsApi = {
  // Get all Bank Accounts with filters and pagination
  getBankAccounts: async (params) => {
    const response = await accountHttpClient.get('/api/account/bank-accounts', { params });
    return response.data;
  },

  // Get Bank Account by ID
  getBankAccountById: async (id) => {
    const response = await accountHttpClient.get(`/api/account/bank-accounts/${id}`);
    return response.data;
  },

  // Get Bank Account by Number
  getBankAccountByNumber: async (accountNumber) => {
    const response = await accountHttpClient.get(`/api/account/bank-accounts/number/${accountNumber}`);
    return response.data;
  },

  // Create new Bank Account
  createBankAccount: async (payload) => {
    const response = await accountHttpClient.post('/api/account/bank-accounts', { data: payload });
    return response.data?.data || response.data;
  },

  updateBankAccount: async ({ id, data, ...rest }) => {
    const updateData = data || rest;
    const { id: _, ...payloadWithoutId } = updateData;
    const response = await accountHttpClient.put(`/api/account/bank-accounts/${id}`, { data: payloadWithoutId });
    return response.data?.data || response.data;
  },

  // Delete Bank Account
  deleteBankAccount: async (id) => {
    const response = await accountHttpClient.delete(`/api/account/bank-accounts/${id}`);
    return response.data;
  },

  // Activate Bank Account
  activateBankAccount: async (id) => {
    const response = await accountHttpClient.put(`/api/account/bank-accounts/${id}/activate`);
    return response.data;
  },

  // Deactivate Bank Account
  deactivateBankAccount: async (id) => {
    const response = await accountHttpClient.put(`/api/account/bank-accounts/${id}/deactivate`);
    return response.data;
  },

  // Set as Primary Bank Account
  setAsPrimary: async (id) => {
    const response = await accountHttpClient.patch(`/api/account/bank-accounts/${id}/primary`);
    return response.data;
  },

  // Remove Primary Bank Account
  removeAsPrimary: async (id) => {
    const response = await accountHttpClient.delete(`/api/account/bank-accounts/${id}/primary`);
    return response.data;
  },

  // Get Bank Ledger
  getBankLedger: async ({ id, params }) => {
    const response = await accountHttpClient.get(`/api/account/bank-accounts/${id}/ledger`, { params });
    return response.data;
  },

  // Get Bank Reconciliation
  getBankReconciliation: async ({ id, params }) => {
    const response = await accountHttpClient.get(`/api/account/bank-accounts/${id}/reconciliation`, { params });
    return response.data;
  }
};
