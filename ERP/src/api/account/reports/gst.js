import apiClient from '../../common/client';

const GST_REPORTS_BASE = '/api/account/reports/gst';
const GST_SUMMARY_BASE = '/api/account/reports/gst';

const post = (url, payload = {}, options = {}) =>
  apiClient.post(url, payload, options).then((r) => r.data);

export const gstReportsApi = {
  getSummary: (payload = {}) => post(`${GST_SUMMARY_BASE}/summary`, payload?.data ? payload : { data: payload }),

  // Dashboard summary — request body is wrapped in a `data` envelope per API contract:
  // POST /api/account/reports/gst/summary  { "data": { companyId, branchId, gstRegistrationId, ... } }
  getSummaryDashboard: (payload = {}) =>
    post(`${GST_SUMMARY_BASE}/summary`, payload?.data ? payload : { data: payload }),

  getGstr1: (payload = {}) => post(`${GST_REPORTS_BASE}/gstr1`, {
    filters: payload,
    pagination: { page: 1, size: 500 },
    sort: { field: 'invoiceDate', direction: 'DESC' }
  }),

  getGstr3b: (payload = {}) => post(`${GST_REPORTS_BASE}/gstr3b`, { filters: payload }),

  getHsnSummary: (payload = {}) => post(`${GST_REPORTS_BASE}/hsn-summary`, { 
    filters: payload, 
    pagination: { page: 1, size: 500 },
    sort: { field: 'invoiceDate', direction: 'DESC' }
  }),

  getItc: (payload = {}) => post(`${GST_REPORTS_BASE}/itc`, { filters: payload }),

  reconcileGstr2b: (payload = {}) => post(`${GST_REPORTS_BASE}/gstr2b/reconcile`, payload),

  // reportName is e.g. "gstr1", "gstr3b". The export format defaults to "excel" or can be passed.
  exportReport: (reportName, payload = {}, format = 'excel') =>
    post(`${GST_REPORTS_BASE}/export/${format.toUpperCase()}?reportName=${reportName}`, payload?.data ? payload : { data: payload }, { responseType: 'blob' }),

  // Dashboard export — same `data` envelope as the summary request body.
  exportDashboard: (type, payload = {}) =>
    post(`${GST_REPORTS_BASE}/export/${type}?reportName=SUMMARY`, payload?.data ? payload : { data: payload }, { responseType: 'blob' }),
};
