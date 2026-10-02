import apiClient from "../common/client";

export const auditLogsApi = {
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/api/account/audit-logs', { params });
    return response;
  }
};
