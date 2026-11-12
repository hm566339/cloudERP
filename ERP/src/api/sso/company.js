import apiClient from '../common/client';

export const getCompanies = async (params = {}, config = {}) => {
  const page = params?.page ?? 0;
  const pageSize = params?.pageSize ?? 200;
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);
  if (params?.search) query.append('search', params.search);
  if (params?.active !== undefined) query.append('active', params.active);

  const response = await apiClient.get(`/api/sso/company?${query.toString()}`, config);
  return response.data?.data || response.data;
};

export const getCompanyById = async (id) => {
  const response = await apiClient.get(`/api/sso/company/${id}`);
  return response.data;
};

export const getCompanyByCode = async (code) => {
  const response = await apiClient.get(`/api/sso/company/code/${code}`);
  return response.data?.data || response.data;
};

export const createCompany = async (data) => {
  const formData = new FormData();
  const requestBlob = new Blob([JSON.stringify({ data })], { type: "application/json" });
  formData.append("request", requestBlob);
  if (data.logo) formData.append("logo", data.logo);
  
  const response = await apiClient.post('/api/sso/company', formData);
  return response.data;
};

export const updateCompany = async (id, data) => {
  const formData = new FormData();
  const requestBlob = new Blob([JSON.stringify({ data })], { type: "application/json" });
  formData.append("request", requestBlob);
  if (data.logo && typeof data.logo !== 'string') formData.append("logo", data.logo);

  const response = await apiClient.put(`/api/sso/company/${id}`, formData);
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await apiClient.delete(`/api/sso/company/${id}`);
  return response.data;
};
