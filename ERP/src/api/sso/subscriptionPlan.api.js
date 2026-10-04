import apiClient from '../common/client';

export const getSubscriptionPlans = async (params = {}) => {
  const query = new URLSearchParams();
  if (params?.active !== undefined && params.active !== '' && params.active !== 'ALL') {
    query.append('active', params.active);
  }
  if (params?.search) {
    query.append('search', params.search);
  }

  const response = await apiClient.get(`/api/sso/subscription-plans?${query.toString()}`);
  return response.data?.data || response.data || [];
};

export const getSubscriptionPlanById = async (id) => {
  const response = await apiClient.get(`/api/sso/subscription-plans/${id}`);
  return response.data?.data || response.data;
};

export const createSubscriptionPlan = async (planData) => {
  const response = await apiClient.post('/api/sso/subscription-plans', { data: planData });
  return response.data?.data || response.data;
};

export const updateSubscriptionPlan = async (id, planData) => {
  const response = await apiClient.put(`/api/sso/subscription-plans/${id}`, { data: planData });
  return response.data?.data || response.data;
};

export const deleteSubscriptionPlan = async (id) => {
  const response = await apiClient.delete(`/api/sso/subscription-plans/${id}`);
  return response.data?.data || response.data;
};

export const toggleSubscriptionPlanStatus = async (id, active) => {
  const response = await apiClient.patch(`/api/sso/subscription-plans/${id}/status?active=${active}`);
  return response.data?.data || response.data;
};

export const assignPlanModules = async (id, moduleIds) => {
  const response = await apiClient.put(`/api/sso/subscription-plans/${id}/modules`, {
    data: { moduleIds }
  });
  return response.data?.data || response.data;
};

export const getCurrentCompanySubscription = async () => {
  const response = await apiClient.get('/api/sso/company-subscriptions/current');
  return response.data?.data || response.data;
};

export const getCompanySubscription = async (companyId) => {
  const response = await apiClient.get(`/api/sso/company-subscriptions/company/${companyId}`);
  return response.data?.data || response.data;
};
