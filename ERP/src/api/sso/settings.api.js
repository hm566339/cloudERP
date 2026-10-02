import apiClient from '../common/client'

export const settingsApi = {
  getCompanySettings: async (companyId) => {
    const response = await apiClient.get(`/api/settings/${companyId}`)
    return response.data
  },

  updateCompanySettings: async (companyId, data) => {
    const response = await apiClient.put(`/api/settings/${companyId}`, data)
    return response.data
  }
}

