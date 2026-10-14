import apiClient from '../common/client';
import { SUBSCRIPTION_ENDPOINTS } from '../../constants/subscriptionConstants';

export const getSubscriptionPlans = async (params = {}) => {
  const query = new URLSearchParams();
  if (params?.active !== undefined && params.active !== '' && params.active !== 'ALL') {
    query.append('active', Boolean(params.active));
  }
  if (params?.search && String(params.search).trim()) {
    query.append('search', String(params.search).trim());
  }

  const queryString = query.toString();
  const url = queryString ? `${SUBSCRIPTION_ENDPOINTS.PLANS}?${queryString}` : SUBSCRIPTION_ENDPOINTS.PLANS;
  const response = await apiClient.get(url);
  return response.data?.data ?? response.data ?? [];
};

export const getSubscriptionPlanById = async (id) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.PLAN_BY_ID(id));
  return response.data?.data ?? response.data;
};

export const getSubscriptionPlanByCode = async (code) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.PLAN_BY_CODE(code));
  return response.data?.data ?? response.data;
};

export const createSubscriptionPlan = async (planData) => {
  const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.PLANS, { data: planData });
  return response.data?.data ?? response.data;
};

export const updateSubscriptionPlan = async (id, planData) => {
  const response = await apiClient.put(SUBSCRIPTION_ENDPOINTS.PLAN_BY_ID(id), { data: planData });
  return response.data?.data ?? response.data;
};

export const deleteSubscriptionPlan = async (id) => {
  const response = await apiClient.delete(SUBSCRIPTION_ENDPOINTS.PLAN_BY_ID(id));
  return response.data?.data ?? response.data;
};

export const toggleSubscriptionPlanStatus = async (id, active) => {
  const response = await apiClient.patch(`${SUBSCRIPTION_ENDPOINTS.PLAN_STATUS(id)}?active=${Boolean(active)}`);
  return response.data?.data ?? response.data;
};

export const assignPlanModules = async (id, moduleIds) => {
  const response = await apiClient.put(SUBSCRIPTION_ENDPOINTS.PLAN_MODULES(id), {
    data: { moduleIds: moduleIds || [] }
  });
  return response.data?.data ?? response.data;
};

export const removePlanModule = async (planId, moduleId) => {
  const response = await apiClient.delete(SUBSCRIPTION_ENDPOINTS.PLAN_MODULE_ITEM(planId, moduleId));
  return response.data?.data ?? response.data;
};

export const getCurrentCompanySubscription = async () => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.COMPANY_SUBSCRIPTION_CURRENT);
  return response.data?.data ?? response.data;
};

export const getCompanySubscription = async (companyId) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.COMPANY_SUBSCRIPTION(companyId));
  return response.data?.data ?? response.data;
};

export const createSubscriptionCheckout = async (organizationId, checkoutData) => {
  const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.CHECKOUT(organizationId), checkoutData);
  return response.data?.data ?? response.data;
};

export const cancelSubscription = async (subscriptionId) => {
  const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.CANCEL_SUBSCRIPTION(subscriptionId));
  return response.data?.data ?? response.data;
};

export const getOrganizationSubscription = async (organizationId) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.ORG_SUBSCRIPTION(organizationId));
  return response.data?.data ?? response.data;
};

export const verifySubscriptionPayment = async (organizationId, payload) => {
  const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.VERIFY_PAYMENT(organizationId), payload);
  return response.data?.data ?? response.data;
};

export const cancelPendingCheckout = async (organizationId, orderId) => {
  try {
    const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.CANCEL_CHECKOUT(organizationId), { orderId });
    return response.data?.data ?? response.data;
  } catch {
    // Gracefully ignore cancellation failure of pending checkout
    return null;
  }
};

export const activateFreeTrial = async (organizationId, planId) => {
  const response = await apiClient.post(SUBSCRIPTION_ENDPOINTS.ACTIVATE_TRIAL(organizationId), { planId });
  return response.data?.data ?? response.data;
};

// Platform Admin Organization Subscriptions & Billing
export const getAdminOrganizationSubscription = async (organizationId) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.ADMIN_ORG_SUBSCRIPTION(organizationId));
  return response.data?.data ?? response.data;
};

export const getAdminOrganizationPayments = async (organizationId) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.ADMIN_ORG_PAYMENTS(organizationId));
  return response.data?.data ?? response.data ?? [];
};

export const getAdminOrganizationInvoices = async (organizationId) => {
  const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.ADMIN_ORG_INVOICES(organizationId));
  return response.data?.data ?? response.data ?? [];
};
