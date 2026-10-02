import apiClient from '../../common/client';

/**
 * Dashboard API layer for the RBAC-based accounting dashboard.
 * Corresponds to the backend DashboardController endpoints.
 */
export const dashboardApi = {
  /** GET /api/account/dashboard — consolidated dashboard */
  getDashboard: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/cards */
  getCards: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/cards', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/charts */
  getCharts: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/charts', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/quick-actions */
  getQuickActions: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/quick-actions', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/navigation */
  getNavigation: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/navigation', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/approvals */
  getApprovals: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/approvals', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/alerts */
  getAlerts: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/alerts', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/activities */
  getActivities: async (params = {}) => {
    const response = await apiClient.get('/api/account/dashboard/activities', { params });
    return response.data || response;
  },

  /** GET /api/account/dashboard/{module} */
  getModuleDashboard: async (module, params = {}) => {
    const response = await apiClient.get(`/api/account/dashboard/${module}`, { params });
    return response.data || response;
  },
};

export const dashboardFinanceApi = {
  getFinanceDashboard: async () => {
    const response = await apiClient.get('/api/account/dashboard/finance');
    return response.data || response;
  }
};
