import { accountHttpClient } from '../common/client';

export const fiscalYearsApi = {
  getFiscalYears: (params) => {
    return accountHttpClient.get('/api/account/fiscal-years', { params });
  },

  getFiscalYearById: (id) => {
    return accountHttpClient.get(`/api/account/fiscal-years/${id}`);
  },

  createFiscalYear: (payload) => {
    const { companyId, data } = payload;
    const params = companyId ? { companyId } : undefined;
    const finalData = companyId ? { companyId, ...data } : data;
    return accountHttpClient.post('/api/account/fiscal-years', { data: finalData }, { params });
  },

  updateFiscalYear: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/fiscal-years/${id}`, { data });
  },

  deleteFiscalYear: (id) => {
    return accountHttpClient.delete(`/api/account/fiscal-years/${id}`);
  },

  updateFiscalYearStatus: ({ id, status }) => {
    return accountHttpClient.patch(`/api/account/fiscal-years/${id}/status`, null, {
      params: { status }
    });
  }
};
