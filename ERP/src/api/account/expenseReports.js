import apiClient from '../common/client';

const BASE_URL = '/api/account/v1/expense-reports';

// Helper to clean empty/undefined filters
const cleanFilters = (filters) => {
  if (!filters) return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(filters)) {
    let cleanVal = value;
    if (typeof value === 'object' && value !== null) {
      if (value.target && value.target.value !== undefined) cleanVal = value.target.value;
      else if (value.value !== undefined) cleanVal = value.value;
    }
    
    if (cleanVal !== undefined && cleanVal !== null && cleanVal !== '' && String(cleanVal).trim().toUpperCase() !== 'ALL') {
      cleaned[key] = cleanVal;
    }
  }
  return cleaned;
};

export const expenseReportsApi = {
  getSummary: (filters) => 
    apiClient.get(`${BASE_URL}/summary`, { params: cleanFilters(filters) }),

  getStaffDriverAnalysis: (filters) => 
    apiClient.get(`${BASE_URL}/staff-driver`, { params: cleanFilters(filters) }),

  getCategoryBreakdown: (filters) => 
    apiClient.get(`${BASE_URL}/category`, { params: cleanFilters(filters) }),

  getVehicleFleetExpenses: (filters) => 
    apiClient.get(`${BASE_URL}/vehicles`, { params: cleanFilters(filters) }),

  getSalesOrderDcExpenses: (filters) => 
    apiClient.get(`${BASE_URL}/sales-order-dc`, { params: cleanFilters(filters) })
};
