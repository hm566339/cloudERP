import apiClient from '../../common/client';

export const getGeneralLedger = async (params) => {
  const response = await apiClient.get('/api/account/v1/reports/general-ledger', { params });
  return response.data;
};

export const generalLedgerApi = {
  getGeneralLedger
};

