import apiClient from '../common/client.js'

export const settingsApi = {
  getCompanySettings: async (companyId) => {
    const response = await apiClient.get(`/api/settings/${companyId}`)
    return response.data
  },

  updateCompanySettings: async (companyId, data) => {
    const response = await apiClient.put(`/api/settings/${companyId}`, data)
    return response.data
  },

  getGeneralSettings: async () => {
    const response = await apiClient.get('/api/settings/general')
    return response.data?.data || response.data
  },

  updateGeneralSettings: async (data) => {
    const response = await apiClient.put('/api/settings/general', data)
    return response.data?.data || response.data
  },

  getOrganizationSettings: async () => {
    const response = await apiClient.get('/api/settings/organization')
    return response.data?.data || response.data
  },

  updateOrganizationSettings: async (data) => {
    const response = await apiClient.put('/api/settings/organization', data)
    return response.data?.data || response.data
  },

  getLocalizationSettings: async () => {
    const response = await apiClient.get('/api/settings/localization')
    return response.data?.data || response.data
  },

  updateLocalizationSettings: async (data) => {
    const response = await apiClient.put('/api/settings/localization', data)
    return response.data?.data || response.data
  }
}

export default settingsApi
